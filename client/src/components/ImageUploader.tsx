/**
 * @author DHENRY for mytinydc.com
 * @license AGPL3
 * source : https://www.codemzy.com/blog/react-drag-drop-file-upload
 */

import { useIntl } from "react-intl";

import "./ImageUploader.scss";
import { useRef } from "react";
import { MAXFILESIZEKBITS } from "../../../src/Constants";

// Supported formats
const supportedImageFormat = ["png", "jpg", "jpeg"];
const imageMimeType = new RegExp(
  `image/(${supportedImageFormat.join("|")})`,
  "i"
);

interface ImageUploaderProps {
  onError: (error: string) => void;
  onChange: (imageBase64: string) => void;
  image: string;
}
export const ImageUploader = ({
  onError,
  onChange,
  image,
}: ImageUploaderProps) => {
  const intl = useIntl();

  // convert KB to B
  const maxFileSize = MAXFILESIZEKBITS * 1024;

  const inputRef = useRef<HTMLInputElement>(null);

  const isMimeTypeSupported = (file: File) => {
    if (!file.type.match(imageMimeType)) {
      onError(
        intl.formatMessage({
          id: "Cannot be operated, supported image types are",
        }) + `: ${supportedImageFormat.join("-")}`
      );
      return false;
    }
    return true;
  };

  const isSizeAcceptable = (file: File) => {
    if (file.size > maxFileSize) {
      onError(
        intl.formatMessage({
          id: "This file is too large, the maximum size allowed is",
        }) + `: ${Math.round(maxFileSize / 1024)}KB`
      );
      return false;
    }
    return true;
  };

  const buildAndSetImage = (file: File) => {
    let fileReader: FileReader;
    if (file) {
      fileReader = new FileReader();
      fileReader.onload = (event: ProgressEvent<FileReader>) => {
        if (event.target && event.target.result) {
          onChange(event.target.result.toString());
        }
      };
      fileReader.readAsDataURL(file);
    }
  };

  // handle drag events
  const handleOnDrag = function (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
  };

  // triggered onDrop
  const handleOnDrop = function (event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (
      event.dataTransfer &&
      event.dataTransfer.files &&
      event.dataTransfer.files[0]
    ) {
      const file: File = event.dataTransfer.files[0];
      if (!isSizeAcceptable(file) || !isMimeTypeSupported(file)) return;
      buildAndSetImage(file);
    }
  };

  // triggered onClick
  const handleInputFileOnChange = function (
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    event.preventDefault();
    if (event.target.files && event.target.files[0]) {
      const file: File = event.target.files[0];
      if (!isSizeAcceptable(file)) return;
      if (isMimeTypeSupported(file)) {
        buildAndSetImage(file);
      }
    }
  };

  return (
    <div className={`ImageUploader`}>
      <input
        ref={inputRef}
        type="file"
        className="inputUploadNative"
        multiple={false}
        onChange={handleInputFileOnChange}
        accept={supportedImageFormat.map((item) => `.${item}`).join(",")}
      />

      <div className="dragDropButtonContainer">
        <div className="imagePpreview">
          {image ? <img src={image} alt="preview" /> : null}
        </div>
        <div
          className="dragDropButton"
          onDragEnter={(event) => handleOnDrag(event)}
          onDragLeave={handleOnDrag}
          onDragOver={handleOnDrag}
          onDrop={handleOnDrop}
        >
          <button
            className="upload-button"
            onClick={() => {
              if (inputRef.current) inputRef.current.click();
            }}
            title={intl.formatMessage({
              id: "Drop your file or click",
            })}
          >
            {intl.formatMessage({
              id: "Drop your file or click",
            }) + ` <= ${MAXFILESIZEKBITS}KB`}
          </button>
        </div>
      </div>
    </div>
  );
};
