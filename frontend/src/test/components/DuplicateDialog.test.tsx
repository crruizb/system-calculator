import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DuplicateDialog } from "../../components/DuplicateDialog";

describe("DuplicateDialog", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <DuplicateDialog
        open={false}
        initialName="Test (copy)"
        initialSlug="test-copy"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        error={null}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders title and pre-filled inputs when open", () => {
    render(
      <DuplicateDialog
        open={true}
        initialName="Diamond Ring (copy)"
        initialSlug="diamond-ring-copy"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        error={null}
      />,
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Duplicate calculator")).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("Diamond Ring (copy)"),
    ).toBeInTheDocument();
    expect(
      screen.getByDisplayValue("diamond-ring-copy"),
    ).toBeInTheDocument();
  });

  it("calls onConfirm with edited name and slug when submitted", async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <DuplicateDialog
        open={true}
        initialName="Diamond Ring (copy)"
        initialSlug="diamond-ring-copy"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        error={null}
      />,
    );

    const nameInput = screen.getByDisplayValue("Diamond Ring (copy)");
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, "Gold Ring");

    const slugInput = screen.getByDisplayValue("diamond-ring-copy");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "gold-ring");

    await userEvent.click(screen.getByRole("button", { name: /duplicate/i }));

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith("Gold Ring", "gold-ring");
    });
  });

  it("calls onCancel when cancel button clicked", async () => {
    const onCancel = vi.fn();
    render(
      <DuplicateDialog
        open={true}
        initialName="Test"
        initialSlug="test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        error={null}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("calls onCancel when backdrop is clicked", async () => {
    const onCancel = vi.fn();
    const { container } = render(
      <DuplicateDialog
        open={true}
        initialName="Test"
        initialSlug="test"
        onConfirm={vi.fn()}
        onCancel={onCancel}
        error={null}
      />,
    );
    await userEvent.click(container.firstChild as HTMLElement);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows error message when provided", () => {
    render(
      <DuplicateDialog
        open={true}
        initialName="Test"
        initialSlug="test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        error="Slug already taken"
      />,
    );
    expect(screen.getByText("Slug already taken")).toBeInTheDocument();
  });

  it("disables submit button while loading", async () => {
    const onConfirm = vi.fn().mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    render(
      <DuplicateDialog
        open={true}
        initialName="Test"
        initialSlug="test"
        onConfirm={onConfirm}
        onCancel={vi.fn()}
        error={null}
      />,
    );
    const submitBtn = screen.getByRole("button", { name: /duplicate/i });
    await userEvent.click(submitBtn);
    await waitFor(() => expect(submitBtn).toBeDisabled());
  });

  it("sanitizes slug input", async () => {
    render(
      <DuplicateDialog
        open={true}
        initialName="Test"
        initialSlug="test"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
        error={null}
      />,
    );
    const slugInput = screen.getByDisplayValue("test");
    await userEvent.clear(slugInput);
    await userEvent.type(slugInput, "My Cool Slug!");
    expect(slugInput).toHaveValue("my-cool-slug-");
  });
});
