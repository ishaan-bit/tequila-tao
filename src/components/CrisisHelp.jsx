// src/components/CrisisHelp.jsx — the "Get help now" surface.
// A calm bottom sheet that puts real, tappable help one tap away from the hardest
// moment (the craving flow's "Urgent help"). It must NOT feel like an alarm:
// reassuring tone, soft colours, and every line is a tel: link so on a phone it
// dials straight through. Emergency lines (112/108) carry the one reserved
// danger accent; support lines are calm teal. One source of truth: content/crisis.js.
import { IconBadge, Sheet } from "./ui.jsx";
import { HeartIcon, PhoneIcon } from "./icons.jsx";
import { CRISIS_LINES, HELPLINE_DIRECTORY } from "../content/crisis.js";

function CallRow({ line }) {
  const emergency = line.kind === "emergency";
  return (
    <a
      href={`tel:${line.tel}`}
      className="list-row min-h-touch"
      data-tone={emergency ? "danger" : undefined}
      aria-label={`Call ${line.name} at ${line.number}`}
    >
      <IconBadge tone={emergency ? "danger" : "teal"}>
        <PhoneIcon size={18} />
      </IconBadge>
      <span className="flex-1 min-w-0">
        <span className={`block font-medium ${emergency ? "text-danger" : "text-pearl"}`}>{line.name}</span>
        <span className="block text-xs text-pearl-faint">{line.note}</span>
      </span>
      <span className="tnum text-sm font-semibold text-pearl shrink-0 ml-1">{line.number}</span>
    </a>
  );
}

export default function CrisisHelp({ open, onClose }) {
  return (
    <Sheet open={open} onClose={onClose} title="You're not alone">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <IconBadge tone="jade"><HeartIcon size={18} /></IconBadge>
          <p className="text-sm text-pearl-soft">
            This is a hard moment, and reaching out is the strong thing to do. These are real people
            in India who will talk with you right now — free, confidential, 24/7. This app isn't a
            substitute for one of them.
          </p>
        </div>

        <div className="space-y-2" role="list">
          {CRISIS_LINES.map((line) => (
            <CallRow key={line.name} line={line} />
          ))}
        </div>

        <a
          href={HELPLINE_DIRECTORY.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center text-xs text-focus underline underline-offset-4 hover:text-pearl min-h-touch pt-1"
        >
          Outside India, or want more options? {HELPLINE_DIRECTORY.label} →
        </a>
      </div>
    </Sheet>
  );
}
