/**
 * Direct YouTube embeds. Search-playlist embeds no longer play.
 * Each id was checked against the public oEmbed endpoint.
 */

const CLIPS = [
    { test: /push|pike|burpee/, id: 'IODxDxX7oi4' },
    { test: /squat/, id: 'YaXPRqUwItQ' },
    { test: /plank|bear/, id: 'pSHjTRCQxIw' },
    { test: /lunge/, id: 'QOVaHwm-Q6U' },
    { test: /bridge|glute/, id: 'wPM8icPu6H8' },
    { test: /climber|high knee/, id: 'nmwgirgXLYM' },
    { test: /calf/, id: 'gwLzBJYoWlI' },
    { test: /bird dog/, id: 'wiFNA3sqjCA' },
    { test: /superman|cobra/, id: 'cc6UVRS7PW4' },
    { test: /twist|bicycle|crunch/, id: 'wkD8rjkodUI' },
    { test: /stretch|hamstring|child/, id: 'FDwpEdxZ4H4' },
];

export function exerciseVideoId(name = '') {
    const q = name.toLowerCase();
    const match = CLIPS.find((clip) => clip.test.test(q));
    return match ? match.id : 'YaXPRqUwItQ';
}

export function exerciseEmbedUrl(name = '') {
    const id = exerciseVideoId(name);
    return `https://www.youtube-nocookie.com/embed/${id}?rel=0&modestbranding=1&playsinline=1`;
}
