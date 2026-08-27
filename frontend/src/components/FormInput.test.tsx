import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FormInput from "./FormInput";

describe("FormInput", () => {
  it("associates the label with the input so it is reachable by name", () => {
    render(<FormInput label="Username" value="" onChange={() => {}} />);

    const input = screen.getByLabelText("Username");
    expect(input).toBeInTheDocument();
  });

  it("reports each keystroke to the parent", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<FormInput label="Hobbies" value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Hobbies"), "chess");

    expect(onChange).toHaveBeenCalledTimes(5);
    expect(onChange).toHaveBeenLastCalledWith("s");
  });
});
