// Rendering-level guarantees for the calendar redesign: the month is labelled,
// today is marked, future days are inert, and tapping a day surfaces its detail.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { localDayKey } from "../app/selectors.js";
import MonthCalendar from "./MonthCalendar.jsx";
import DayDetail from "./DayDetail.jsx";

const at = (y, m, d) => new Date(y, m, d, 12, 0, 0).getTime();
const NOW = at(2026, 5, 15); // 15 Jun 2026
const days = new Map([[localDayKey(at(2026, 5, 10)), { clear: true, any: true, clearMoney: 800, clearDrinks: 2 }]]);

function renderCal(props = {}) {
  return render(
    <MemoryRouter>
      <MonthCalendar year={2026} monthIndex={5} daysMap={days} now={NOW} {...props} />
    </MemoryRouter>
  );
}

describe("MonthCalendar rendering", () => {
  it("labels the month and year unmistakably", () => {
    renderCal();
    expect(screen.getByText(/June 2026/i)).toBeInTheDocument();
  });

  it("marks exactly one day as today", () => {
    renderCal();
    const today = screen.getByRole("button", { name: /2026-06-15.*today/i });
    expect(today).toHaveAttribute("aria-current", "date");
  });

  it("renders future days as inert (not missing data)", () => {
    renderCal();
    const future = screen.getByRole("button", { name: /2026-06-20.*upcoming/i });
    expect(future).toBeDisabled();
  });

  it("surfaces a tapped day's detail via onSelectDay", () => {
    const onSelectDay = vi.fn();
    renderCal({ onSelectDay });
    fireEvent.click(screen.getByRole("button", { name: /2026-06-10.*clear/i }));
    expect(onSelectDay).toHaveBeenCalledTimes(1);
    expect(onSelectDay.mock.calls[0][0]).toMatchObject({ dayKey: "2026-06-10", status: "clear" });
  });

  it("shows a humane month summary", () => {
    renderCal();
    expect(screen.getByText(/1 of 15 nights alcohol-free/i)).toBeInTheDocument();
  });
});

describe("DayDetail rendering", () => {
  const clearCell = {
    inMonth: true, dayKey: "2026-06-10", dayNum: 10, isToday: false, isFuture: false,
    status: "clear", moneySaved: 800, drinksAvoided: 2, drinks: 0, mood: 4,
  };

  it("tells a logged night's story with its mood", () => {
    render(<MemoryRouter><DayDetail day={clearCell} currency="INR" /></MemoryRouter>);
    expect(screen.getByText(/alcohol-free night/i)).toBeInTheDocument();
    expect(screen.getByText(/Felt:/i)).toBeInTheDocument();
  });

  it("a drank night is framed without shame", () => {
    render(
      <MemoryRouter>
        <DayDetail day={{ ...clearCell, status: "drank", drinks: 3, mood: null }} />
      </MemoryRouter>
    );
    expect(screen.getByText(/no shame/i)).toBeInTheDocument();
  });

  it("a future night says it hasn't arrived rather than offering to log it", () => {
    render(
      <MemoryRouter>
        <DayDetail day={{ ...clearCell, status: "none", isFuture: true, dayKey: "2026-06-20" }} />
      </MemoryRouter>
    );
    expect(screen.getByText(/hasn't arrived yet/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mark alcohol-free/i)).not.toBeInTheDocument();
  });
});
