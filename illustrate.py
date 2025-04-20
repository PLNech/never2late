import os
import json
import argparse
import torch
import numpy as np
import PIL.Image
import gc
import requests
import random
import textwrap
from tqdm import tqdm
from transformers import AutoConfig, AutoModelForCausalLM
from janus.models import MultiModalityCausalLM, VLChatProcessor

# Super-image upscaling
try:
    from super_image import EdsrModel, MsrnModel, ImageLoader
    SUPER_IMAGE_AVAILABLE = True
except ImportError:
    SUPER_IMAGE_AVAILABLE = False
    print("Warning: super-image package not found. Upscaling will use basic methods.")
    print("Install with: pip install super-image")


def create_artistic_prompt(poem, local_llm_url=None, llm_model="gemma3:4b"):
    """Create an artistic prompt for image generation using advanced techniques"""
    lines = poem["lines"]
    theme = poem["theme"]
    seed = poem["seed"]
    
    # Basic prompt construction
    combined_poem = " ".join(lines)
    
    if local_llm_url:
        try:
            # Use local LLM to create a more artistic prompt
            prompt_instruction = f"""make a precise image prompt from this poem:
{combined_poem}
theme: {theme}
seed concept: {seed}

return only the sentence you will be parsed as string no punctuation no comment just the prompt. 
Must be 100 words max. Half of prompt describes style half describe content 
both foreground and background and focal. 
The image must not include any human character except faraway silhouettes. 
Use dreamy, surreal imagery with expressionist brushstrokes, muted pastel palette, 
intricate symbolic details. NO TEXT, no writing, no letters or words in the image."""
            
            # Call the local LLM API
            response = requests.post(
                local_llm_url + "/api/generate",
                json={
                    "model": llm_model,
                    "stream": False,
                    "prompt": prompt_instruction
                },
                timeout=30
            )
            
            if response.status_code == 200:
                llm_response = response.json().get("response", "")
                artistic_prompt = llm_response.strip()
                
                # Print poem details and enhanced prompt for debugging
                print(f"\nPoem details:")
                print(f"Theme: {theme}")
                print(f"Seed: {seed}")
                print(f"Lines: {lines}")
                print(f"\nLLM-enhanced prompt: {artistic_prompt}")
                
                # Safety check for length
                if len(artistic_prompt.split()) > 120:
                    artistic_prompt = " ".join(artistic_prompt.split()[:120])
                
                # Always add the "no text" instruction
                artistic_prompt += " No text, no writing, no words, no letters should be visible in the image."
                return artistic_prompt
            else:
                print(f"Warning: Failed to get prompt from LLM. Status code: {response.status_code}")
        except Exception as e:
            print(f"Error using local LLM: {str(e)}")
    
    # Fallback to manual prompt creation if LLM fails or isn't available
    style_elements = [
        "surreal dreamscape", "muted pastel palette", "mixed-perspective composition", 
        "intricate symbolic details", "expressionist brushstrokes", "ethereal atmosphere",
        "dreamlike quality", "mystical ambiance", "symbolic imagery", "metaphysical scene"
    ]
    
    atmosphere_elements = [
        "twilight haze", "whispered shadows", "unresolved tension", "melancholic beauty",
        "ethereal glow", "haunting emptiness", "timeless moment", "subtle emotional resonance",
        "contemplative silence", "liminal space", "golden hour lighting"
    ]
    
    # Select a few random elements for variation
    style = random.choice(style_elements)
    atmosphere = random.choice(atmosphere_elements)
    
    # Create a prompt combining theme, seed, lines and artistic elements
    prompt = f"An artistic visualization of a poem about {theme} with the essence of {seed}. "
    prompt += f"A {style} with {atmosphere}, depicting a scene where {lines[0].lower()}. "
    
    if len(lines) > 1:
        prompt += f"In this image, {lines[1].lower()}, "
    
    if len(lines) > 2:
        prompt += f"while {lines[2].lower()}. "
    
    # Add style guidance
    prompt += "The image should have artistic, dreamlike quality with beautiful composition. "
    prompt += "No text, no writing, no words, no letters should be visible in the image."
    
    return prompt


@torch.inference_mode()
def generate_image(
    vl_gpt,
    vl_chat_processor,
    prompt,
    seed=None,
    guidance=5.0,
    temperature=1.0,
    parallel_size=1,
    device="cuda",
):
    """Generate an image based on the prompt using Janus-Pro-1B"""
    # Force garbage collection before starting
    gc.collect()
    torch.cuda.empty_cache()
    
    # Set seed for reproducibility if provided
    if seed is not None:
        torch.manual_seed(seed)
        np.random.seed(seed)
        if torch.cuda.is_available():
            torch.cuda.manual_seed(seed)
    
    # The model is designed for 384x384 images
    width = 384
    height = 384
    patch_size = 16
    image_token_num_per_image = 576  # Standard for 384x384 with patch size 16
    
    # Prepare the conversation format
    messages = [
        {"role": "<|User|>", "content": prompt},
        {"role": "<|Assistant|>", "content": ""},
    ]

    text = vl_chat_processor.apply_sft_template_for_multi_turn_prompts(
        conversations=messages,
        sft_format=vl_chat_processor.sft_format,
        system_prompt=""
    )
    text = text + vl_chat_processor.image_start_tag
    
    input_ids = torch.LongTensor(vl_chat_processor.tokenizer.encode(text))
    
    # Generate image tokens
    tokens = torch.zeros((parallel_size * 2, len(input_ids)), dtype=torch.int).to(device)
    for i in range(parallel_size * 2):
        tokens[i, :] = input_ids
        if i % 2 != 0:
            tokens[i, 1:-1] = vl_chat_processor.pad_id
    
    # Use half-precision for embeddings if on CUDA
    dtype = torch.bfloat16 if torch.cuda.is_available() else torch.float16
    
    with torch.cuda.amp.autocast(enabled=device=="cuda"):
        inputs_embeds = vl_gpt.language_model.get_input_embeddings()(tokens)
    
    generated_tokens = torch.zeros((parallel_size, image_token_num_per_image), dtype=torch.int).to(device)
    
    pkv = None
    for i in range(image_token_num_per_image):
        with torch.cuda.amp.autocast(enabled=device=="cuda"):
            outputs = vl_gpt.language_model.model(
                inputs_embeds=inputs_embeds,
                use_cache=True,
                past_key_values=pkv
            )
            pkv = outputs.past_key_values
            hidden_states = outputs.last_hidden_state
            
            logits = vl_gpt.gen_head(hidden_states[:, -1, :])
            logit_cond = logits[0::2, :]
            logit_uncond = logits[1::2, :]
            
            logits = logit_uncond + guidance * (logit_cond - logit_uncond)
            probs = torch.softmax(logits / temperature, dim=-1)
            
            next_token = torch.multinomial(probs, num_samples=1)
            generated_tokens[:, i] = next_token.squeeze(dim=-1)
            
            next_token = torch.cat([next_token.unsqueeze(dim=1), next_token.unsqueeze(dim=1)], dim=1).view(-1)
            img_embeds = vl_gpt.prepare_gen_img_embeds(next_token)
            inputs_embeds = img_embeds.unsqueeze(dim=1)
        
        # Periodically clear cache during generation
        if i % 64 == 0 and i > 0:
            torch.cuda.empty_cache()
    
    # Decode the generated tokens into an image
    with torch.cuda.amp.autocast(enabled=device=="cuda"):
        patches = vl_gpt.gen_vision_model.decode_code(
            generated_tokens.to(dtype=torch.int),
            shape=[parallel_size, 8, width // patch_size, height // patch_size]
        )
    
    # Convert patches to images
    patches = patches.to(torch.float32).cpu().numpy().transpose(0, 2, 3, 1)
    patches = np.clip((patches + 1) / 2 * 255, 0, 255)
    
    # Create PIL images
    images = []
    for i in range(parallel_size):
        img_array = patches[i].astype(np.uint8)
        img = PIL.Image.fromarray(img_array)
        images.append(img)
    
    # Final cleanup
    torch.cuda.empty_cache()
    gc.collect()
    
    return images[0]  # Return just the first image


def upscale_image(image, scale=2, method="super-image"):
    """Upscale an image using super-image or basic PIL methods"""
    if method == "super-image" and SUPER_IMAGE_AVAILABLE:
        try:
            # Use super-image for better upscaling
            model = MsrnModel.from_pretrained('eugenesiow/msrn', scale=scale)
            inputs = ImageLoader.load_image(image)
            preds = model(inputs)
            
            # Convert the tensor to PIL image
            upscaled_image = ImageLoader.tensor_to_image(preds)
            return upscaled_image
        except Exception as e:
            print(f"Error using super-image: {str(e)}")
            print("Falling back to basic upscaling...")
    
    # Fallback to basic PIL upscaling
    try:
        width, height = image.size
        # Use Lanczos for better quality
        resampling = PIL.Image.LANCZOS if hasattr(PIL.Image, 'LANCZOS') else PIL.Image.Resampling.LANCZOS
        return image.resize((width * scale, height * scale), resampling)
    except Exception as e:
        print(f"Error in basic upscaling: {str(e)}")
        return image  # Return original if all fails

def overlay_poem_on_image(image, poem, uppercase_chance=0.3):
    """Add poem text overlay directly on the image"""
    from PIL import Image, ImageDraw, ImageFont, ImageEnhance, ImageFilter
    import random
    
    # Get image dimensions
    img_width, img_height = image.size
    
    # Create a copy of the image to work with
    canvas = image.copy()
    
    # Prepare for drawing
    draw = ImageDraw.Draw(canvas)
    
    
    # Try to load a nice font, fall back to default if not available
    try:
        # Try to find a good font, these are common on many systems
        font_options = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/TTF/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
            "/Windows/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf"
        ]
        
        font_path = None
        for option in font_options:
            if os.path.exists(option):
                font_path = option
                break
        
        if font_path:
            title_font = ImageFont.truetype(font_path, size=int(img_width/15))
            body_font = ImageFont.truetype(font_path, size=int(img_width/25))
        else:
            # Fall back to default font
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
    except Exception:
        # If any error occurs with fonts, use default
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
    
    # Position text in lower third of the image
    title_y = int(img_height * 0.7)  # 70% down the image
    poem_y = title_y + int(img_width/25)  # Start poem text below title
    
    # Draw semi-transparent background for text
    overlay = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.rectangle([(0, title_y - 10), (img_width, img_height)], 
                         fill=(0, 0, 0, 180))  # Black with 70% opacity
    
    # Make sure image is in RGBA mode for compositing
    if canvas.mode != 'RGBA':
        canvas = canvas.convert('RGBA')
    canvas = Image.alpha_composite(canvas, overlay)
    
    # Create a new drawing context for the composited image
    draw = ImageDraw.Draw(canvas)
    
    # Use theme as title - with WHITE color for visibility
    title = poem["theme"]
    if random.random() < uppercase_chance:
        title = title.upper()
    
    # Draw title - with bright white color (255,255,255)
    try:
        # Calculate title dimensions
        if hasattr(title_font, 'getbbox'):
            title_bbox = title_font.getbbox(title)
            title_width = title_bbox[2] - title_bbox[0]
            draw.text((img_width/2 - title_width/2, title_y), 
                    title, fill=(255, 255, 255), font=title_font)
        else:
            # Fallback
            draw.text((img_width/2, title_y), 
                    title, fill=(255, 255, 255), font=title_font, align="center")
            
        # Draw poem lines with white text
        y_position = poem_y
        for line in poem["lines"]:
            draw.text((img_width/2, y_position), 
                    line, fill=(255, 255, 255), font=body_font, align="center")
            y_position += int(img_width/25)  # Fixed line spacing
            
    except Exception as e:
        # Emergency fallback
        print(f"Text drawing error: {str(e)}")
        draw.text((10, title_y), 
                title.upper(), fill=(255, 255, 255), font=ImageFont.load_default())
        y_position = title_y + 20
        for line in poem["lines"]:
            draw.text((10, y_position), 
                    line, fill=(255, 255, 255), font=ImageFont.load_default())
            y_position += 15
    
    # Convert back to RGB for saving
    canvas = canvas.convert('RGB')
    return canvas
    
    
    # Position text in lower third of the image
    title_y = int(img_height * 0.7)  # 70% down the image
    poem_y = title_y + int(img_width/25)  # Start poem text below title
    
    # Add semi-transparent background for better text visibility
    # Draw a rectangle behind the text area
    overlay = Image.new('RGBA', canvas.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    text_bg_height = img_height - title_y + int(img_width/12)  # Height needed for text
    overlay_draw.rectangle([(0, title_y - 10), (img_width, img_height)], 
                         fill=(0, 0, 0, 180))  # Black with 70% opacity
    
    # Merge the overlay with the image
    if canvas.mode != 'RGBA':
        canvas = canvas.convert('RGBA')
    canvas = Image.alpha_composite(canvas, overlay)
    canvas = canvas.convert('RGB')  # Convert back to RGB
    
    # Create a new drawing context for the composited image
    draw = ImageDraw.Draw(canvas)
    
    # Try to load a nice font, fall back to default if not available
    try:
        # Try to find a good font, these are common on many systems
        font_options = [
            "/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf",
            "/usr/share/fonts/TTF/Arial.ttf",
            "/Library/Fonts/Arial.ttf",
            "/Windows/Fonts/Arial.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
            # Add more fallback options
            "/usr/share/fonts/truetype/freefont/FreeSans.ttf",
            "/usr/share/fonts/truetype/freefont/FreeSerif.ttf",
            "/usr/share/fonts/truetype/ubuntu/Ubuntu-R.ttf",
            "/System/Library/Fonts/Helvetica.ttc",
        ]
        
        font_path = None
        for option in font_options:
            if os.path.exists(option):
                font_path = option
                break
        
        if font_path:
            title_font = ImageFont.truetype(font_path, size=int(img_width/15))
            body_font = ImageFont.truetype(font_path, size=int(img_width/25))
        else:
            # Fall back to default font
            title_font = ImageFont.load_default()
            body_font = ImageFont.load_default()
    except Exception as e:
        print(f"Font loading error: {str(e)}")
        # If any error occurs with fonts, use default
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()
    
    # Use theme as title
    title = poem["theme"]
    if random.random() < uppercase_chance:
        title = title.upper()
    
    # Prepare poem lines with random uppercase styling
    wrapped_lines = []
    for line in poem["lines"]:
        # Stylize the text - sometimes uppercase
        if random.random() < uppercase_chance:
            line = line.upper()
        
        # Wrap long lines
        if len(line) > 30:
            wrapped = textwrap.wrap(line, width=30)
            wrapped_lines.extend(wrapped)
        else:
            wrapped_lines.append(line)
    
    # Positions for text
    title_y = img_height + 20
    poem_y = title_y + int(img_width/12)
    
    # Add a subtle shadow to make text more readable
    shadow_offset = 3
    
    # METHOD 1: Modern approach with getbbox (for newer Pillow versions)
    try:
        # Check if getbbox is available
        if hasattr(title_font, 'getbbox'):
            # Calculate title dimensions
            title_bbox = title_font.getbbox(title)
            title_width = title_bbox[2] - title_bbox[0]
            
            # Draw title with shadow
            draw.text((img_width/2 - title_width/2 + shadow_offset, title_y + shadow_offset), 
                      title, fill=(30, 30, 30), font=title_font)
            draw.text((img_width/2 - title_width/2, title_y), 
                      title, fill=(255, 255, 255), font=title_font)
            
            # Draw poem lines one by one
            y_position = poem_y
            for line in wrapped_lines:
                text_bbox = body_font.getbbox(line)
                line_width = text_bbox[2] - text_bbox[0]
                
                # Draw shadow and text
                draw.text((img_width/2 - line_width/2 + shadow_offset, y_position + shadow_offset),
                         line, fill=(30, 30, 30), font=body_font)
                draw.text((img_width/2 - line_width/2, y_position),
                         line, fill=(220, 220, 220), font=body_font)
                
                # Calculate line height from bounding box and add spacing
                line_height = text_bbox[3] - text_bbox[1]
                y_position += line_height + 8
                
            print("Overlay created using modern method (getbbox)")
            return canvas
        else:
            raise AttributeError("getbbox not available")
            
    except (AttributeError, TypeError) as e:
        print(f"Modern method failed: {str(e)}")
        # METHOD 2: Legacy approach with textsize (for older Pillow versions)
        try:
            if hasattr(draw, 'textsize'):
                # Calculate title dimensions
                title_width, title_height = draw.textsize(title, font=title_font)
                
                # Draw title with shadow
                draw.text((img_width/2 - title_width/2 + shadow_offset, title_y + shadow_offset), 
                          title, fill=(30, 30, 30), font=title_font)
                draw.text((img_width/2 - title_width/2, title_y), 
                          title, fill=(255, 255, 255), font=title_font)
                
                # Draw poem lines one by one
                y_position = poem_y
                for line in wrapped_lines:
                    line_width, line_height = draw.textsize(line, font=body_font)
                    
                    # Draw shadow and text
                    draw.text((img_width/2 - line_width/2 + shadow_offset, y_position + shadow_offset),
                             line, fill=(30, 30, 30), font=body_font)
                    draw.text((img_width/2 - line_width/2, y_position),
                             line, fill=(220, 220, 220), font=body_font)
                    
                    # Move to next line position
                    y_position += line_height + 8
                    
                print("Overlay created using legacy method (textsize)")
                return canvas
            else:
                raise AttributeError("textsize not available")
                
        except Exception as e2:
            print(f"Legacy method failed: {str(e2)}")
            # METHOD 3: Absolute fallback - simple centered text without size calculations
            try:
                # Draw title at fixed position
                # Estimate title width as 80% of image width
                text_width = int(img_width * 0.8)
                left_margin = (img_width - text_width) // 2
                
                # Draw title (centered manually)
                draw.text((img_width // 2, title_y), 
                          title, fill=(255, 255, 255), font=title_font,
                          align="center")
                
                # Draw text in a block with estimated positioning
                y_position = poem_y
                line_height = int(img_width/20)  # Estimated line height
                
                for line in wrapped_lines:
                    # Draw each line with estimated center position
                    draw.text((img_width // 2, y_position), 
                              line, fill=(220, 220, 220), font=body_font,
                              align="center")
                    y_position += line_height
                    
                print("Overlay created using simplified fallback method")
                return canvas
                
            except Exception as e3:
                print(f"Simplified method failed: {str(e3)}")
                # METHOD 4: Emergency fallback - minimal approach with fixed positioning
                try:
                    # Use default font
                    default_font = ImageFont.load_default()
                    
                    # Draw title with fixed positioning
                    draw.text((10, img_height + 10), 
                              title.upper(), fill=(255, 255, 255), font=default_font)
                    
                    # Draw poem lines with fixed positioning
                    y_position = img_height + 40
                    for line in poem["lines"]:
                        draw.text((10, y_position), 
                                  line, fill=(220, 220, 220), font=default_font)
                        y_position += 15
                    
                    print("Overlay created using emergency fallback method")
                    return canvas
                    
                except Exception as e4:
                    print(f"Emergency method failed: {str(e4)}")
                    # If all attempts fail, just return the original canvas with image
                    return canvas
                    
def load_janus_model(model_path="deepseek-ai/Janus-Pro-1B", device="cuda"):
    """Load Janus-Pro-1B model with memory optimizations"""
    print(f"Loading model from {model_path}...")
    
    # Clear memory before loading
    gc.collect()
    torch.cuda.empty_cache()
    
    # Load Janus model and processor
    config = AutoConfig.from_pretrained(model_path)
    
    # Set to eager attention implementation for compatibility
    language_config = config.language_config
    language_config._attn_implementation = 'eager'
    
    # Determine dtype based on device
    dtype = torch.bfloat16 if torch.cuda.is_available() and device == "cuda" else torch.float16
    
    # Load the processor with fast tokenization
    vl_chat_processor = VLChatProcessor.from_pretrained(
        model_path,
        use_fast=True    # Use fast tokenizer to avoid warning
    )
    
    # Load the model with memory optimizations
    vl_gpt = AutoModelForCausalLM.from_pretrained(
        model_path,
        language_config=language_config,
        trust_remote_code=True,
        low_cpu_mem_usage=True,
    )
    
    # Move to device and set dtype
    if device == "cuda" and torch.cuda.is_available():
        vl_gpt = vl_gpt.to(dtype).cuda()
    else:
        vl_gpt = vl_gpt.to(dtype)
        device = "cpu"  # Fallback to CPU
    
    print(f"Model loaded successfully on {device}!")
    return vl_gpt, vl_chat_processor


def process_poems(poems, vl_gpt, vl_chat_processor, args):
    """Process poems and generate images"""
    os.makedirs(args.output, exist_ok=True)
    
    # Skip poems if requested
    if args.skip > 0:
        poems = poems[args.skip:]
        print(f"Skipping the first {args.skip} poems")
    
    for i, poem in enumerate(tqdm(poems)):
        if args.limit is not None and i >= args.limit:
            break
            
        print(f"\nProcessing poem {i+1}/{min(len(poems), args.limit or len(poems))}")
        
        # Create prompt from poem using LLM if available
        llm_url = args.llm_url if args.use_llm else None
        prompt = create_artistic_prompt(poem, llm_url, args.llm_model)
        # print(f"Prompt: {prompt}")
        
        try:
            # Create a seed from the poem if not provided
            poem_seed = args.seed
            if poem_seed is None and "seed" in poem:
                # Use the poem's seed word to create a numerical seed
                poem_seed = sum(ord(c) for c in poem["seed"]) % 10000
            
            # Generate image
            image = generate_image(
                vl_gpt,
                vl_chat_processor,
                prompt,
                seed=poem_seed,
                guidance=args.guidance,
                temperature=args.temperature,
                device=args.device
            )
            
            # Create a clean filename from theme and seed
            theme = poem["theme"].replace(" ", "_")
            seed_word = poem["seed"].replace(" ", "_")
            base_filename = f"poem_{i+1}_{theme}_{seed_word}"
            
            # Upscale the image if requested (scale > 1)
            if args.scale > 1:
                image = upscale_image(
                    image, 
                    scale=args.scale, 
                    method="super-image" if args.use_super_image else "basic"
                )
            
            # Save with poem overlay if requested, otherwise save plain image
            if args.overlay:
                try:
                    overlay_image = overlay_poem_on_image(image, poem)
                    filename = f"{args.output}/{base_filename}.jpg"
                    overlay_image.save(filename)
                    print(f"Saved image with poem overlay to {filename}")
                except Exception as e:
                    print(f"Error creating overlay: {str(e)}")
                    # Fallback to saving without overlay
                    filename = f"{args.output}/{base_filename}.jpg"
                    image.save(filename)
                    print(f"Saved image without overlay to {filename}")
            else:
                filename = f"{args.output}/{base_filename}.jpg"
                image.save(filename)
                print(f"Saved image to {filename}")
            
        except Exception as e:
            print(f"Error processing poem {i+1}: {str(e)}")
            # Save error details for debugging
            try:
                error_log = f"{args.output}/error_log.txt"
                with open(error_log, "a") as f:
                    f.write(f"Error processing poem {i+1} ({poem['theme']}/{poem['seed']}):\n{str(e)}\n\n")
            except:
                pass
            torch.cuda.empty_cache()
            gc.collect()
        
        # Clear memory after each poem
        torch.cuda.empty_cache()
        gc.collect()


def main():
    parser = argparse.ArgumentParser(description="Generate images from poems using Janus-Pro-1B with enhancements")
    parser.add_argument("--input", type=str, default="poems.json", help="Input JSON file with poems")
    parser.add_argument("--output", type=str, default="./output/img/", help="Output directory for images")
    parser.add_argument("--model_path", type=str, default="deepseek-ai/Janus-Pro-1B", help="Path to Janus-Pro model")
    parser.add_argument("--temperature", type=float, default=1.0, help="Temperature for generation")
    parser.add_argument("--guidance", type=float, default=5.0, help="Guidance scale for generation")
    parser.add_argument("--device", type=str, default="cuda", help="Device to use (cuda or cpu)")
    parser.add_argument("--seed", type=int, default=None, help="Random seed for generation")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of poems to process")
    parser.add_argument("--skip", type=int, default=0, help="Skip the first N poems")
    parser.add_argument("--overlay", action="store_true", default=True, 
                      help="Overlay poem text on image in motivational poster style")
    parser.add_argument("--no-overlay", action="store_false", dest="overlay",
                      help="Don't overlay poem text on image")
    
    # Simplified parameters
    parser.add_argument("--scale", type=int, default=2, help="Upscale factor (1 = no upscaling)")
    parser.add_argument("--use-super-image", action="store_true", default=True,
                      help="Use super-image for high-quality upscaling")
    parser.add_argument("--no-super-image", action="store_false", dest="use_super_image",
                      help="Use basic PIL upscaling instead of super-image")
    parser.add_argument("--use-llm", action="store_true", default=False,
                      help="Use local LLM to enhance prompts")
    parser.add_argument("--llm-url", type=str, default="http://localhost:11434",
                      help="URL of local LLM API (Ollama)")
    parser.add_argument("--llm-model", type=str, default="gemma3:4b",
                      help="Model name to use with local LLM")
    
    args = parser.parse_args()
    
    # Check if super-image is available
    if args.use_super_image and not SUPER_IMAGE_AVAILABLE:
        print("Warning: super-image package not found. Falling back to basic upscaling.")
        print("Install super-image with: pip install super-image")
        args.use_super_image = False
    
    # Check if CUDA is available
    if args.device == "cuda" and not torch.cuda.is_available():
        print("CUDA is not available. Falling back to CPU.")
        args.device = "cpu"
    
    # Print GPU info if available
    if torch.cuda.is_available():
        device_name = torch.cuda.get_device_name(0)
        memory_allocated = torch.cuda.memory_allocated(0) / 1e9
        memory_reserved = torch.cuda.memory_reserved(0) / 1e9
        print(f"GPU: {device_name}")
        print(f"Memory allocated: {memory_allocated:.2f} GB")
        print(f"Memory reserved: {memory_reserved:.2f} GB")
    
    # Load poems from JSON file
    try:
        with open(args.input, 'r') as f:
            poems = json.load(f)
        print(f"Loaded {len(poems)} poems from {args.input}")
    except Exception as e:
        print(f"Error loading poems: {str(e)}")
        return
    
    # Load model
    vl_gpt, vl_chat_processor = load_janus_model(args.model_path, args.device)
    
    # Process poems
    process_poems(poems, vl_gpt, vl_chat_processor, args)
    
    print("\nImage generation complete!")


if __name__ == "__main__":
    main()
