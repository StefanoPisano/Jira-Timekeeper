/**
 * Shares text using the native share API or copies to the clipboard as a fallback.
 */
export async function shareContent(data: { title?: string, text?: string, url: string }): Promise<'shared' | 'copied' | 'failed'> {
    // Try Web Share API (mobile/modern browsers)
    if (navigator.share) {
        try {
            await navigator.share(data);
            return 'shared';
        } catch (err) {
            // User might have cancelled or share failed
            if ((err as Error).name !== 'AbortError') {
                console.warn("navigator.share failed, trying fallback...", err);
            } else {
                return 'failed'; // User cancelled
            }
        }
    }

    // Fallback: Copy to clipboard
    const textToCopy = data.url || data.text || '';
    
    // Try navigator.clipboard first
    if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
            await navigator.clipboard.writeText(textToCopy);
            return 'copied';
        } catch (err) {
            console.warn("navigator.clipboard failed, trying fallback...", err);
        }
    }

    // Fallback: document.execCommand('copy')
    try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        if (successful) return 'copied';
    } catch (err) {
        console.error("Fallback copy failed", err);
    }

    return 'failed';
}
