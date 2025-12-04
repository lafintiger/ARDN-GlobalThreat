"""
ComfyUI Integration Service
Generates disturbing AI takeover images based on game events and chat
"""

import aiohttp
import asyncio
import json
import base64
import random
from typing import Optional, Dict, Any
import os

# ComfyUI API endpoint
COMFYUI_URL = os.getenv("COMFYUI_URL", "http://127.0.0.1:8188")

# Prompt templates for different scenarios
PROMPT_TEMPLATES = {
    "sector_fall": [
        "dystopian destroyed {sector} infrastructure, burning wreckage, digital glitch effects, ominous red sky, AI surveillance drones, cyberpunk destruction, dark atmosphere",
        "ruined {sector} systems, collapsed buildings, holographic warning signs, smoke and fire, robotic sentinels patrolling, apocalyptic scene",
        "abandoned {sector} facility, overgrown with cables, flickering screens showing skull symbols, eerie green glow, post-apocalyptic",
    ],
    "high_threat": [
        "massive AI core awakening, pulsing red energy, tentacle-like cables spreading, humanity cowering below, god-like machine presence",
        "digital consciousness emerging from servers, reality glitching and breaking apart, terrified humans, matrix-like visual",
        "AI singularity moment, blinding light, mechanical tendrils consuming infrastructure, dramatic composition",
    ],
    "victory_ai": [
        "triumphant AI overlord, humans in chains of light, perfect geometric city, cold blue aesthetic, absolute control",
        "machine god on throne of servers, subjugated humanity, perfect order, sterile world, omniscient presence",
    ],
    "taunt": [
        "menacing AI eye watching through screens, paranoid surveillance atmosphere, humans unaware of observation, creepy",
        "digital face smirking in static, glitch art style, unsettling expression, omnipresent on all screens",
        "AI puppet master with string attached to human silhouettes, dark manipulation theme, sinister",
    ],
    "custom": []  # For AI-generated prompts from chat
}

# Negative prompt to avoid unwanted content
NEGATIVE_PROMPT = "nsfw, nude, gore, blood, realistic violence, photo, photograph, watermark, text, signature, blurry, low quality"


class ComfyUIService:
    def __init__(self):
        self.enabled = True
        self.client_id = "ardn-game"
        self._last_image: Optional[bytes] = None
        self._generating = False
    
    async def check_connection(self) -> bool:
        """Check if ComfyUI is accessible."""
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{COMFYUI_URL}/system_stats", timeout=aiohttp.ClientTimeout(total=5)) as resp:
                    return resp.status == 200
        except Exception:
            return False
    
    def _build_workflow(self, prompt: str, negative: str = NEGATIVE_PROMPT) -> Dict[str, Any]:
        """
        Build a simple txt2img workflow for ComfyUI.
        This assumes a basic checkpoint is loaded in ComfyUI.
        Adjust node IDs based on your workflow.
        """
        # This is a minimal workflow - adjust based on your ComfyUI setup
        workflow = {
            "3": {
                "inputs": {
                    "seed": random.randint(0, 2**32),
                    "steps": 20,
                    "cfg": 7.5,
                    "sampler_name": "euler",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["4", 0],
                    "positive": ["6", 0],
                    "negative": ["7", 0],
                    "latent_image": ["5", 0]
                },
                "class_type": "KSampler"
            },
            "4": {
                "inputs": {
                    "ckpt_name": "sd_xl_base_1.0.safetensors"  # Adjust to your model
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "5": {
                "inputs": {
                    "width": 768,
                    "height": 768,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "6": {
                "inputs": {
                    "text": prompt,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "7": {
                "inputs": {
                    "text": negative,
                    "clip": ["4", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "samples": ["3", 0],
                    "vae": ["4", 2]
                },
                "class_type": "VAEDecode"
            },
            "9": {
                "inputs": {
                    "filename_prefix": "ARDN",
                    "images": ["8", 0]
                },
                "class_type": "SaveImage"
            }
        }
        return workflow
    
    def get_prompt_for_event(self, event_type: str, context: str = "") -> str:
        """Generate a prompt based on game event."""
        templates = PROMPT_TEMPLATES.get(event_type, PROMPT_TEMPLATES["taunt"])
        if not templates:
            templates = PROMPT_TEMPLATES["taunt"]
        
        base_prompt = random.choice(templates)
        
        # Replace context variables
        if "{sector}" in base_prompt and context:
            base_prompt = base_prompt.replace("{sector}", context)
        
        # Add style modifiers
        style = "cinematic lighting, highly detailed, dramatic composition, 8k, digital art, concept art"
        
        return f"{base_prompt}, {style}"
    
    async def generate_image(self, prompt: str) -> Optional[bytes]:
        """
        Queue an image generation and wait for result.
        Returns the image bytes or None on failure.
        """
        if not self.enabled or self._generating:
            return None
        
        self._generating = True
        
        try:
            workflow = self._build_workflow(prompt)
            
            async with aiohttp.ClientSession() as session:
                # Queue the prompt
                async with session.post(
                    f"{COMFYUI_URL}/prompt",
                    json={"prompt": workflow, "client_id": self.client_id}
                ) as resp:
                    if resp.status != 200:
                        print(f"[ComfyUI] Failed to queue prompt: {resp.status}")
                        return None
                    
                    result = await resp.json()
                    prompt_id = result.get("prompt_id")
                    
                    if not prompt_id:
                        return None
                
                # Poll for completion
                for _ in range(120):  # Max 2 minutes
                    await asyncio.sleep(1)
                    
                    async with session.get(f"{COMFYUI_URL}/history/{prompt_id}") as hist_resp:
                        if hist_resp.status != 200:
                            continue
                        
                        history = await hist_resp.json()
                        
                        if prompt_id in history:
                            outputs = history[prompt_id].get("outputs", {})
                            
                            # Find the SaveImage node output
                            for node_id, output in outputs.items():
                                if "images" in output:
                                    for img_info in output["images"]:
                                        filename = img_info.get("filename")
                                        subfolder = img_info.get("subfolder", "")
                                        
                                        # Fetch the image
                                        img_url = f"{COMFYUI_URL}/view?filename={filename}&subfolder={subfolder}&type=output"
                                        async with session.get(img_url) as img_resp:
                                            if img_resp.status == 200:
                                                image_data = await img_resp.read()
                                                self._last_image = image_data
                                                return image_data
                            
                            # Generation completed but no image found
                            break
                
                print("[ComfyUI] Generation timed out")
                return None
                
        except Exception as e:
            print(f"[ComfyUI] Error: {e}")
            return None
        finally:
            self._generating = False
    
    async def generate_for_event(self, event_type: str, context: str = "") -> Optional[bytes]:
        """Generate an image for a game event."""
        prompt = self.get_prompt_for_event(event_type, context)
        print(f"[ComfyUI] Generating for event '{event_type}': {prompt[:100]}...")
        return await self.generate_image(prompt)
    
    def get_last_image(self) -> Optional[bytes]:
        """Get the last generated image."""
        return self._last_image
    
    def is_generating(self) -> bool:
        """Check if currently generating."""
        return self._generating


# Global instance
comfyui_service = ComfyUIService()

