import React, { useState, useEffect, useRef } from "react";
import { FieldProps } from "react-jsonschema-form";
import { JSONSchema7 } from "json-schema";
import { spinnerUrl } from "./spinner";

import { Icon } from "./icon";
import { MenuComponent, MenuItemComponent } from "./menu";
import { Camera } from "../../mobile-app/components/camera";

import css from "./photo-or-note-field.module.scss";

interface IPhotoOrNoteSchema {
  type: "array";
  items: {
    type: "object";
    properties: {
      isPhoto: boolean;
      localPhotoUrl: string;
      remotePhotoUrl: string;
      note: string;
      timestamp: string;
    };
  };
}

export interface IPhotoOrNote {
  isPhoto: boolean;
  localPhotoUrl: string;
  remotePhotoUrl: string;
  note: string;
  timestamp: string;
}

type IPhotoOrNoteData = IPhotoOrNote[];

// Validates if provided schema matches IDataPhotoSchema interface.
const validateSchema = (schema: JSONSchema7): IPhotoOrNoteSchema => {
  if (schema.type !== "array") {
    throw new Error("PhotoField requires array data type");
  }
  const items = (schema.items as JSONSchema7);
  if (
    typeof items !== "object" || items.type !== "object" ||
    typeof items.properties !== "object" ||
    typeof items.properties.isPhoto !== "object" || items.properties.isPhoto.type !== "boolean" ||
    typeof items.properties.localPhotoUrl !== "object" || items.properties.localPhotoUrl.type !== "string" ||
    typeof items.properties.remotePhotoUrl !== "object" || items.properties.remotePhotoUrl.type !== "string" ||
    typeof items.properties.note !== "object" || items.properties.note.type !== "string" ||
    typeof items.properties.timestamp !== "object" || items.properties.timestamp.type !== "string" || items.properties.timestamp.format !== "date-time"
  ) {
    throw new Error("PhotoOrNoteField requires array of photo or note objects data type");
  }
  return schema as IPhotoOrNoteSchema;
};

interface IImageProps {
  src: string;
  height?: number;
  width?: number;
  marginLeft?: number;
}
export const Image: React.FC<IImageProps> = ({src, height, width, marginLeft}) => {
  const isPhotoUrl = src.match(/^photo\:\/\//);
  const [resolvedSrc, setResolvedSrc] = useState(isPhotoUrl ? spinnerUrl : src);

  useEffect(() => {
    if (isPhotoUrl) {
      const fetchOptions: RequestInit = {
        method: "GET",
        mode: "cors",
        cache: "no-cache",
        headers: {
          "Content-Type": "application/json"
          // TODO: add jwt to request header once we setup React context to know we are in Lara
        }
      };
      const url = `https://us-central1-vortex-e5d5d.cloudfunctions.net/getExperimentPhoto?src=${encodeURIComponent(src)}`;
      fetch(url, fetchOptions)
        .then(resp => resp.json())
        .then(json => {
          if (json.success) {
            setResolvedSrc(json.result);
          } else {
            alert(json.result);
          }
        });
    }
  }, []);

  const style = width ? {width, height, marginLeft} : {width: "100%"};

  return <img src={resolvedSrc} style={style} />;
};

interface IPhotoProps {
  photo: IPhotoOrNote;
  deletePhoto: (photo: IPhotoOrNote) => void;
  saveAll: () => void;
  width: number;
  height: number;
}

export const Photo: React.FC<IPhotoProps> = ({photo, deletePhoto, saveAll, width, height}) => {
  const {localPhotoUrl, remotePhotoUrl} = photo;
  const addCaptionRef = useRef<HTMLInputElement|null>(null);
  const handleDeletePhoto = () => deletePhoto(photo);
  const handleAddCaptionKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (addCaptionRef.current) {
      photo.note = addCaptionRef.current.value.trim();
      saveAll();
    }
  };
  const [addCaptionHeight, setAddCaptionHeight] = useState(0);

  const saveAddCaptionRef = (el: HTMLInputElement|null) => {
    if (el) {
      addCaptionRef.current = el;
      setAddCaptionHeight(el.getBoundingClientRect().height);
    }
  };

  // since images are square the resizing doesn't need to check ratios
  const imageHeight = height - addCaptionHeight;
  const imageWidth = imageHeight;
  const imageMarginLeft = (width - imageWidth) / 2;
  const menuRight = imageMarginLeft + 5;

  return (
    <>
      <div className={css.photo}>
        <div className={css.photoMenu} style={{right: menuRight}}>
          <MenuComponent>
            <MenuItemComponent onClick={handleDeletePhoto}>Delete Photo</MenuItemComponent>
          </MenuComponent>
        </div>
        <Image src={localPhotoUrl || remotePhotoUrl} width={imageWidth} height={imageHeight} marginLeft={imageMarginLeft} />
      </div>
      <input type="text" className={css.photoNote} placeholder="Add a note" ref={saveAddCaptionRef} defaultValue={photo.note} onKeyUp={handleAddCaptionKeyUp} />
    </>
  );
};

export const Thumbnail: React.FC<{photo: IPhotoOrNote, selected: boolean, selectPhoto: (photo: IPhotoOrNote) => void}> = ({photo, selected, selectPhoto}) => {
  const {localPhotoUrl, remotePhotoUrl} = photo;
  const handleClick = () => selectPhoto(photo);
  const hasCaption = (photo.note || "").trim().length > 0;
  return (
    <div className={`${css.thumbnail} ${selected ? css.selectedPhoto : ""}`} onClick={handleClick}>
      <Image src={localPhotoUrl || remotePhotoUrl} />
      {hasCaption ? <div className={css.hasCaption}><Icon name="comment" /></div> : undefined}
    </div>
  );
};

export const Note: React.FC<{note: IPhotoOrNote, deleteNote: (note: IPhotoOrNote) => void}> = ({note, deleteNote}) => {
  const localTime = (new Date(note.timestamp)).toLocaleString();
  const handleDeleteNote = () => deleteNote(note);
  return (
    <div className={css.note}>
      <div className={css.noteMenu}>
        <MenuComponent>
          <MenuItemComponent onClick={handleDeleteNote}>Delete Note</MenuItemComponent>
        </MenuComponent>
      </div>
      <div className={css.noteText}>{note.note}</div>
      <div className={css.noteTimestamp}>{localTime}</div>
    </div>
  );
};

export const PhotoOrNoteField: React.FC<FieldProps> = props => {
  const { schema, onChange } = props;
  try {
    validateSchema(schema as JSONSchema7);
  } catch (e) {
    return <div>{e.message}</div>;
  }

  const addNoteRef = useRef<HTMLTextAreaElement|null>(null);
  const [formData, setFormData] = useState<IPhotoOrNoteData>(props.formData || []);
  const [subTab, setSubTab] = useState<"note" | "photo">("note");
  const [lastSaved, setLastSaved] = useState<Date | undefined>(undefined);

  const photos = () => formData.filter(item => item.isPhoto);
  const notes = () => formData.filter(item => !item.isPhoto);

  const [selectedPhoto, setSelectedPhoto] = useState<IPhotoOrNote|undefined>(photos()[0]);

  const [photoSubTabTop, setPhotoSubTabTop] = useState(0);
  const [thumbnailListWidth, setThumbnailListWidth] = useState(0);
  const [thumbnailListLeft, setThumbnailListLeft] = useState(0);

  const updateFormData = (newFormData: IPhotoOrNote[]) => {
    setFormData(newFormData);
    onChange(newFormData);
  };

  useEffect(() => {
    // on first render if the form data is undefined (old data that does not have photos)
    // then set to empty array so that we can auto-migrate old schema data
    if (!props.formData) {
      updateFormData([]);
    }
  }, []);

  if (formData.constructor !== Array) {
    return <div>Unexpected photo data format</div>;
  }

  const timestamp = () => (new Date()).toISOString();

  const handleAddPhoto = () => setSelectedPhoto(undefined);

  const handleSelectNoteSubTab = () => setSubTab("note");
  const handleSelectPhotoSubTab = () => setSubTab("photo");
  const handleAddNoteKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (addNoteRef.current) {
      const note = addNoteRef.current.value.trim();
      if ((note.length > 0) && (e.keyCode === 13)) {
        e.preventDefault();
        updateFormData([{
          isPhoto: false,
          localPhotoUrl: "",
          remotePhotoUrl: "",
          note,
          timestamp: timestamp()
        }, ...formData]);
        addNoteRef.current.value = "";
      }
    }
  };
  const handleDeletePhotoOrNote = (item: IPhotoOrNote) => {
    const newFormData = formData.slice();
    const index = formData.indexOf(item);
    newFormData.splice(index, 1);
    updateFormData(newFormData);
    if (item.isPhoto && (item === selectedPhoto)) {
      const currentPhotos = photos();
      setSelectedPhoto(currentPhotos[index + 1] || currentPhotos[index - 1]);
    }
  };
  const handleSaveAll = () => {
    updateFormData(formData);
    // setting this will cause a re-render updating the thumbnail caption icons
    setLastSaved(new Date());
  };

  const handleCameraPhoto = (localPhotoUrl: string) => {
    const newPhoto = {
      isPhoto: true,
      localPhotoUrl,
      remotePhotoUrl: "",
      note: "",
      timestamp: timestamp()
    };
    updateFormData([newPhoto, ...formData]);
    setSelectedPhoto(newPhoto);
  };

  const renderNoteSubTab = () => {
    return (
      <div className={css.noteSubTab}>
        <textarea className={css.addNote} ref={addNoteRef} placeholder="Add a note" onKeyUp={handleAddNoteKeyUp} />
        {notes().map((note, index) => <Note key={index} note={note} deleteNote={handleDeletePhotoOrNote} />)}
      </div>
    );
  };

  const renderCameraOrPhoto = () => {
    if (selectedPhoto) {
      const selectedPhotoKey = selectedPhoto ? formData.indexOf(selectedPhoto) : -1;
      const photoHeight = window.innerHeight - photoSubTabTop - 100; // 100 is thumbnail height with padding
      const photoWidth = window.innerWidth;

      // manually handle horizontal scrolling
      // this sets the thumbnailListLeft state variable which ranges from 0 to -maxLeft
      const handleThumbnailScrollStart = (eStart: React.MouseEvent<HTMLDivElement>|React.TouchEvent<HTMLDivElement>) => {
        const isTouch = eStart.type === "touchstart";

        const mouseStartEvent = eStart as React.MouseEvent<HTMLDivElement>;
        const touchStartEvent = eStart as React.TouchEvent<HTMLDivElement>;

        const startLeft = thumbnailListLeft;
        const startX = touchStartEvent.touches?.[0].clientX || mouseStartEvent.clientX;
        const maxLeft = Math.min(0, window.innerWidth - thumbnailListWidth);

        let moved = false;
        const onMove = (eMove: MouseEvent|TouchEvent) => {
          eMove.stopPropagation();
          eMove.preventDefault();
          const mouseMoveEvent = eMove as MouseEvent;
          const touchMoveEvent = eMove as TouchEvent;
          const dx = (touchMoveEvent.touches?.[0].clientX || mouseMoveEvent.clientX) - startX;
          const newLeft = Math.max(maxLeft, Math.min(startLeft + dx, 0));
          setThumbnailListLeft(newLeft);
          moved = true;
        };

        const onEnd = (eUp: MouseEvent|TouchEvent) => {
          if (moved) {
            // prevent selecting a thumbnail
            eUp.stopPropagation();
            eUp.preventDefault();
          }
          window.removeEventListener(isTouch ? "touchmove" : "mousemove", onMove);
          window.removeEventListener(isTouch ? "touchend" : "mouseup", onEnd);
        };

        // the passive flag disables Chrome console warnings about cancelling events
        // see https://developers.google.com/web/updates/2017/01/scrolling-intervention
        window.addEventListener(isTouch ? "touchmove" : "mousemove", onMove, {passive: false});
        window.addEventListener(isTouch ? "touchend" : "mouseup", onEnd, {passive: false});
      };

      return (
        <>
          <Photo
            key={selectedPhotoKey}
            photo={selectedPhoto}
            deletePhoto={handleDeletePhotoOrNote}
            saveAll={handleSaveAll}
            width={photoWidth}
            height={photoHeight}
          />
          <div className={css.thumbnails}>
            <div
              className={css.thumbnailList}
              style={{left: thumbnailListLeft}}
              ref={el => setThumbnailListWidth(el?.getBoundingClientRect().width || 0)}
              onMouseDown={handleThumbnailScrollStart}
              onTouchStart={handleThumbnailScrollStart}
            >
              {photos().length > 0 ?
                <div className={css.addPhoto} onClick={handleAddPhoto}>
                  <Icon name="camera" />
                </div> : undefined}
              {photos().map((photo) => {
                const selected = photo === selectedPhoto;
                return <Thumbnail key={photo.timestamp} photo={photo} selected={selected} selectPhoto={setSelectedPhoto} />;
              })}
            </div>
          </div>
        </>
      );
    }

    const cameraHeight = window.innerHeight - photoSubTabTop - 30; // 15 is the margin
    const cameraWidth = window.innerWidth;

    return <Camera onPhoto={handleCameraPhoto} width={cameraWidth} height={cameraHeight} />;
  };

  const renderPhotoSubTab = () => {
    return (
      <div className={css.photoSubTab} ref={(el) => setPhotoSubTabTop(el?.getBoundingClientRect().top || 0)}>
        {renderCameraOrPhoto()}
      </div>
    );
  };

  const subTabClassName = (_subTab: "photo" | "note") => `${css.icon} ${subTab === _subTab ? css.active : ""}`;

  return (
    <div className={css.photoOrNote}>
      <div className={css.subTabs}>
        <div className={subTabClassName("note")} onClick={handleSelectNoteSubTab}><Icon name="comment" /></div>
        <div className={subTabClassName("photo")} onClick={handleSelectPhotoSubTab}><Icon name="photo" /></div>
      </div>
      {subTab === "note" ? renderNoteSubTab() : renderPhotoSubTab() }
    </div>
  );
};
