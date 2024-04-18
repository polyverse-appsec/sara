
const CopyToClipboardIcon = ({ copied }: { copied: boolean }) => (
    copied ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 ml-2">
    <path d="M9 12l2 2 4-4" stroke="#4CAF50" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
    <circle cx="12" cy="12" r="10" stroke="#4CAF50" stroke-width="2" fill="none" />
    </svg>
) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="cursor-pointer w-4 h-4 ml-2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
)
);
export default CopyToClipboardIcon
