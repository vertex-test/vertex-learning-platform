import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { Bell } from "lucide-react";
import { Button } from "./ui/Button";
import { Nav } from "./ui/Nav";

/* The bell stays presentational (AGENTS.md §7); the account slot is Clerk. */
function HeaderActions() {
  return (
    <>
      <button
        type="button"
        aria-label="Notifications"
        className="rounded-sm p-1 text-neutral-700 outline-none hover:text-neutral-900 focus-visible:ring-2 focus-visible:ring-primary-400"
      >
        <Bell className="h-5 w-5" strokeWidth={1.75} />
      </button>
      <Show when="signed-out">
        <SignInButton mode="modal">
          <Button variant="text">Sign in</Button>
        </SignInButton>
        <SignUpButton mode="modal">
          <Button variant="secondary">Sign up</Button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <UserButton
          appearance={{
            elements: {
              avatarBox: "h-11 w-11 border border-neutral-200 rounded-full",
            },
          }}
        />
      </Show>
    </>
  );
}

/** The site header used by every page: nav plus the bell and account slot. */
export function SiteHeader({ activeHref }: { activeHref?: string } = {}) {
  return <Nav activeHref={activeHref} actions={<HeaderActions />} />;
}
