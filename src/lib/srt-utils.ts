
export interface SrtCue {
  index: number;
  start: number;
  end: number;
  text: string;
}

const timeToSeconds = (time: string): number => {
  const parts = time.split(':');
  const secondsParts = parts[2].split(',');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  const seconds = parseInt(secondsParts[0], 10);
  const milliseconds = parseInt(secondsParts[1], 10);
  return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
};

const secondsToTime = (totalSeconds: number): string => {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const milliseconds = Math.round((totalSeconds - Math.floor(totalSeconds)) * 1000);

  const pad = (num: number, size = 2) => num.toString().padStart(size, '0');

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)},${pad(milliseconds, 3)}`;
};

export const parseSrt = (srtContent: string): SrtCue[] => {
  const cues: SrtCue[] = [];
  const blocks = srtContent.trim().split(/\n\s*\n/);

  for (const block of blocks) {
    const lines = block.trim().split('\n');
    if (lines.length >= 2) {
      // Allow blocks with just time and text, index is optional
      let index, timeLineIndex;
      const potentialIndex = parseInt(lines[0], 10);
      const isIndexNumeric = !isNaN(potentialIndex) && !lines[0].includes('-->');
      
      if(isIndexNumeric) {
        index = potentialIndex;
        timeLineIndex = 1;
      } else {
        index = cues.length + 1;
        timeLineIndex = 0;
      }

      if(lines.length < timeLineIndex + 1) continue;

      const timeMatch = lines[timeLineIndex].match(/(\d{1,2}:\d{2}:\d{2}[,.]\d{1,3}) --> (\d{1,2}:\d{2}:\d{2}[,.]\d{1,3})/);
      
      if (timeMatch) {
        const start = timeToSeconds(timeMatch[1].replace('.',','));
        const end = timeToSeconds(timeMatch[2].replace('.',','));
        const text = lines.slice(timeLineIndex + 1).join('\n');
        
        cues.push({ index, start, end, text });
      }
    }
  }
  return cues;
};

export const compileSrt = (cues: SrtCue[]): string => {
  return cues.map((cue, i) => {
    const start = secondsToTime(cue.start);
    const end = secondsToTime(cue.end);
    return `${i + 1}\n${start} --> ${end}\n${cue.text}`;
  }).join('\n\n');
};

export const shiftSrtTime = (cue: SrtCue, shiftInSeconds: number): SrtCue => {
    return {
        ...cue,
        start: cue.start + shiftInSeconds,
        end: cue.end + shiftInSeconds,
    };
};

export const redistributeSrt = (srtContent: string, wordsPerCue: number): string => {
  const originalCues = parseSrt(srtContent);
  if (originalCues.length === 0) return srtContent;

  const fullText = originalCues.map(cue => cue.text).join(' ').replace(/\s+/g, ' ').trim();
  const allWords = fullText.split(' ');
  
  const totalDuration = originalCues[originalCues.length - 1].end - originalCues[0].start;
  const timePerWord = allWords.length > 0 ? totalDuration / allWords.length : 0;

  const newCues: SrtCue[] = [];
  let currentTime = originalCues[0].start;

  for (let i = 0; i < allWords.length; i += wordsPerCue) {
    const chunk = allWords.slice(i, i + wordsPerCue);
    if (chunk.length === 0) continue;

    const chunkText = chunk.join(' ');
    const chunkDuration = chunk.length * timePerWord;
    
    const startTime = currentTime;
    const endTime = currentTime + chunkDuration;

    newCues.push({
      index: newCues.length + 1,
      start: startTime,
      end: endTime,
      text: chunkText,
    });

    currentTime = endTime;
  }

  return compileSrt(newCues);
};
