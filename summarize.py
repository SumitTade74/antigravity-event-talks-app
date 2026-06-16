import os
import re
from collections import Counter

def get_sentences(text):
    # Split text into sentences using regex lookarounds
    sentences = re.split(r'(?<!\w\.\w.)(?<![A-Z][a-z]\.)(?<=\.|\?)\s', text)
    return [s.strip() for s in sentences if s.strip()]

def summarize_text(text, num_sentences=3):
    sentences = get_sentences(text)
    if len(sentences) <= num_sentences:
        return " ".join(sentences)
        
    # Clean and tokenize words to calculate frequencies
    words = re.findall(r'\b\w+\b', text.lower())
    # Filter common stop words to focus on content
    stopwords = set([
        'the', 'a', 'and', 'is', 'in', 'it', 'of', 'to', 'for', 'with', 'on', 'at', 
        'by', 'an', 'this', 'that', 'are', 'was', 'were', 'be', 'or', 'as', 'from', 
        'at', 'our', 'your', 'we', 'you', 'i', 'us', 'they', 'he', 'she', 'has', 'have'
    ])
    words = [w for w in words if w not in stopwords]
    
    word_freq = Counter(words)
    if not word_freq:
        return " ".join(sentences[:num_sentences])
        
    max_freq = max(word_freq.values())
    for word in word_freq:
        word_freq[word] /= max_freq
        
    # Score sentences based on word frequencies
    sentence_scores = {}
    for sentence in sentences:
        sentence_words = re.findall(r'\b\w+\b', sentence.lower())
        score = sum(word_freq.get(w, 0) for w in sentence_words)
        # Normalize by word count to avoid bias towards long sentences
        sentence_scores[sentence] = score / max(1, len(sentence_words))
        
    # Get top sentences in original order
    sorted_sentences = sorted(sentences, key=lambda s: sentence_scores.get(s, 0), reverse=True)
    top_sentences = sorted_sentences[:num_sentences]
    
    # Sort top sentences to maintain chronological order in original text
    ordered_sentences = sorted(top_sentences, key=lambda s: sentences.index(s))
    return " ".join(ordered_sentences)

def main():
    docs_dir = "Documents"
    if not os.path.exists(docs_dir):
        print(f"Directory '{docs_dir}' not found.")
        return
        
    files = [f for f in os.listdir(docs_dir) if os.path.isfile(os.path.join(docs_dir, f))]
    processed = 0
    
    for filename in files:
        if filename.startswith("summary_") or filename == ".gitkeep":
            continue
            
        filepath = os.path.join(docs_dir, filename)
        name, ext = os.path.splitext(filename)
        
        # Process text and markdown files
        if ext.lower() not in ['.txt', '.md']:
            continue
            
        try:
            with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                
            summary = summarize_text(content)
            
            # Create summary file name (matching summary_ORIGINAL_FILENAME.txt/md format)
            summary_filename = f"summary_{name}.txt"
            summary_filepath = os.path.join(docs_dir, summary_filename)
            
            with open(summary_filepath, 'w', encoding='utf-8') as f:
                f.write(summary)
                
            print(f"Generated summary for '{filename}' -> '{summary_filename}'")
            processed += 1
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    print(f"Finished processing. Summarized {processed} file(s).")

if __name__ == "__main__":
    main()
