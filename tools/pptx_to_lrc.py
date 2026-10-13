import argparse
import json
import re
from pathlib import Path
from pptx import Presentation

def clean_text(text):
    # Remove extra spaces, keep newlines for readability but not for splitting
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def split_sentences(text):
    # Split text into sentences using simple punctuation rules
    sentences = re.split(r'(?<=[.!?])\s+', text)
    return [s.strip() for s in sentences if s.strip()]

def count_words(text):
    return len(re.findall(r'\w+', text))

def main():
    parser = argparse.ArgumentParser(description="Convert PPTX speaker notes to LRC and JSON")
    parser.add_argument("pptx_file", help="Path to the input PPTX file")
    parser.add_argument("--duration", type=int, default=300, help="Total duration in seconds")
    parser.add_argument("--output", help="Prefix for output files (e.g. 'poster' for poster.lrc and poster.json)")
    
    args = parser.parse_args()
    
    pptx_path = Path(args.pptx_file)
    if not pptx_path.exists():
        print(f"Error: {args.pptx_file} does not exist.")
        return
        
    if args.output:
        out_prefix = Path(args.output).with_suffix('')
    else:
        out_prefix = pptx_path.with_suffix('')

    prs = Presentation(pptx_path)
    
    slides_data = []
    total_words = 0
    
    # First pass: collect all sentences and word counts
    for i, slide in enumerate(prs.slides):
        slide_num = i + 1
        notes = ""
        if slide.has_notes_slide:
            notes = slide.notes_slide.notes_text_frame.text
            
        notes = clean_text(notes)
        if not notes:
            continue
            
        sentences = split_sentences(notes)
        slide_sentences = []
        slide_words = 0
        
        for s in sentences:
            wc = count_words(s)
            if wc > 0:
                slide_sentences.append({"text": s, "words": wc})
                slide_words += wc
                
        if slide_words > 0:
            slides_data.append({
                "slide": slide_num,
                "sentences": slide_sentences,
                "words": slide_words,
                "full_text": notes
            })
            total_words += slide_words
            
    if total_words == 0:
        print("No speaker notes found in the presentation.")
        return

    # Second pass: allocate times
    current_time = 0.0
    
    lrc_lines = []
    json_slides = []
    
    for slide_data in slides_data:
        slide_start_time = current_time
        slide_num = slide_data["slide"]
        
        # Add slide tag to the first sentence of the slide
        first_sentence = True
        
        for sent in slide_data["sentences"]:
            sent_words = sent["words"]
            sent_duration = (sent_words / total_words) * args.duration
            
            # Format time as mm:ss.xx
            mins = int(current_time // 60)
            secs = current_time % 60
            time_str = f"[{mins:02d}:{secs:05.2f}]"
            
            if first_sentence:
                lrc_lines.append(f"{time_str}[slide={slide_num}] {sent['text']}")
                first_sentence = False
            else:
                lrc_lines.append(f"{time_str} {sent['text']}")
                
            current_time += sent_duration
            
        slide_end_time = current_time
        
        json_slides.append({
            "slide": slide_num,
            "start": round(slide_start_time, 2),
            "end": round(slide_end_time, 2),
            "text": slide_data["full_text"]
        })
        
        lrc_lines.append("") # Empty line after each slide for readability

    # Write LRC
    lrc_path = f"{out_prefix}.lrc"
    with open(lrc_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lrc_lines))
        
    # Write JSON
    json_path = f"{out_prefix}.json"
    json_data = {
        "title": pptx_path.stem,
        "duration": args.duration,
        "slides": json_slides
    }
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(json_data, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {lrc_path} and {json_path}")

if __name__ == "__main__":
    main()
