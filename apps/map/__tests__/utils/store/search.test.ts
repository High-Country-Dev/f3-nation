import { beforeEach, describe, expect, it } from "vitest";

import { searchStore } from "~/utils/store/search";

describe("searchStore", () => {
  beforeEach(() => {
    searchStore.setState(
      {
        text: "",
        placesResults: [],
        shouldShowResults: false,
        searchBarFocused: false,
        searchBarRef: searchStore.getState().searchBarRef,
      },
      true,
    );
  });

  it("has the expected initial state", () => {
    const state = searchStore.getState();
    expect(state.text).toBe("");
    expect(state.placesResults).toEqual([]);
    expect(state.shouldShowResults).toBe(false);
    expect(state.searchBarFocused).toBe(false);
    expect(state.searchBarRef).toHaveProperty("current");
  });

  it("updates state via setState", () => {
    searchStore.setState({ text: "foundry", shouldShowResults: true });

    const state = searchStore.getState();
    expect(state.text).toBe("foundry");
    expect(state.shouldShowResults).toBe(true);
  });

  it("reads individual fields via get", () => {
    searchStore.setState({ searchBarFocused: true });

    expect(searchStore.get("searchBarFocused")).toBe(true);
  });
});
