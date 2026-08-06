/**
 * Photo/panel height ratios from the skill reference:
 * references/photo-abstract-editorial-prompt.en.md — section 5
 */

export type EditorialOrientation = "landscape" | "portrait" | "square";

export interface EditorialLayout {
  orientation: EditorialOrientation;
  /** Share of the final composite height used by the photo area. */
  photoHeightRatio: number;
  /** Share of the final composite height used by the abstract panel. */
  abstractHeightRatio: number;
}

const LAYOUTS: Record<EditorialOrientation, EditorialLayout> = {
  landscape: {
    orientation: "landscape",
    photoHeightRatio: 0.45,
    abstractHeightRatio: 0.55,
  },
  portrait: {
    orientation: "portrait",
    photoHeightRatio: 0.615,
    abstractHeightRatio: 0.385,
  },
  square: {
    orientation: "square",
    photoHeightRatio: 0.53,
    abstractHeightRatio: 0.47,
  },
};

export function getEditorialOrientation(width: number, height: number): EditorialOrientation {
  const ratio = width / height;
  if (ratio > 1.2) return "landscape";
  if (ratio < 0.85) return "portrait";
  return "square";
}

export function getEditorialLayout(width: number, height: number): EditorialLayout {
  return LAYOUTS[getEditorialOrientation(width, height)];
}

/** Expected composite aspect ratio when the skill layout is followed. */
export function getExpectedCompositeAspectRatio(width: number, height: number): number {
  const sourceAspectRatio = width / height;
  const { photoHeightRatio } = getEditorialLayout(width, height);
  return sourceAspectRatio * photoHeightRatio;
}

export function editorialLayoutStyle(layout: EditorialLayout): string {
  return `--photo-ratio:${layout.photoHeightRatio};--abstract-ratio:${layout.abstractHeightRatio}`;
}
