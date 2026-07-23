import { describe, expect, it } from "vitest";
import {
  pathForScreen,
  SCREEN_META,
  SCREEN_PATHS,
  screenFromPath,
} from "./routes";
import type { Screen } from "../data";

const SCREENS = Object.keys(SCREEN_PATHS) as Screen[];

describe("routes", () => {
  it("round-trips every screen through its path", () => {
    for (const s of SCREENS) {
      expect(screenFromPath(pathForScreen(s))).toBe(s);
    }
  });

  it("maps the root path to the dashboard", () => {
    expect(screenFromPath("/")).toBe("dashboard");
  });

  it("returns null for an unknown path so the 404 renders", () => {
    expect(screenFromPath("/does-not-exist")).toBeNull();
    expect(screenFromPath("/api/chat")).toBeNull();
  });

  it("tolerates a trailing slash without soft-404ing", () => {
    expect(screenFromPath("/progress/")).toBe("progress");
    expect(screenFromPath("/")).toBe("dashboard"); // but keeps root intact
  });

  it("has a distinct path for every screen", () => {
    const paths = SCREENS.map(pathForScreen);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("has title and non-empty description metadata for every screen", () => {
    for (const s of SCREENS) {
      expect(SCREEN_META[s].title).toMatch(/Brainfy/);
      expect(SCREEN_META[s].description.length).toBeGreaterThan(20);
    }
  });
});
