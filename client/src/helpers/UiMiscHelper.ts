/**
 * generic method to copy div content to clipboard
 * @param divRef
 * @returns
 */
export const copyToClipboard = (divRef: React.MutableRefObject<null>) => {
  return new Promise((resolv, reject) => {
    if (divRef.current) {
      try {
        const textToCopy = (divRef.current as HTMLDivElement).innerText;
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        resolv(null);
      } catch (error) {
        reject(error);
      }
    } else {
      reject(new Error("divRef must be provided"));
    }
  });
};
