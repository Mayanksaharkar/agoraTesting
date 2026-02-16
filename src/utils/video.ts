/**
 * Converts a standard YouTube URL to an embed URL.
 * Handles youtube.com/watch?v=ID, youtu.be/ID, and existing embed URLs.
 */
export const getYouTubeEmbedUrl = (url?: string): string => {
  if (!url) return '';
  
  // if it's already an embed url, just return it
  if (url.includes('youtube.com/embed/')) return url;

  let videoId = '';
  
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === 'youtu.be') {
      videoId = urlObj.pathname.slice(1);
    } else if (urlObj.hostname.includes('youtube.com')) {
      videoId = urlObj.searchParams.get('v') || '';
      if (!videoId && urlObj.pathname.includes('/v/')) {
        videoId = urlObj.pathname.split('/v/')[1];
      }
    }
  } catch (e) {
    // Basic regex fallback if URL parsing fails
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    videoId = (match && match[2].length === 11) ? match[2] : '';
  }

  return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
};
