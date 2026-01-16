import { ImageResponse } from "next/og";
import { JSX } from "react";

export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const width = Number(searchParams.get("w")) || 1179;
  const height = Number(searchParams.get("h")) || 2556;
  const tz = searchParams.get("tz") || "UTC";
  const theme = searchParams.get("theme") || "dark";

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: tz }));

  const year = now.getFullYear();

  const start = new Date(year, 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86400000);

  const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  const totalDays = isLeapYear ? 366 : 365;
  const daysLeft = totalDays - dayOfYear;
  const percent = ((dayOfYear / totalDays) * 100).toFixed(1);

  const bg = theme === "light" ? "#FFFFFF" : "#000000";
  const passed = theme === "light" ? "#000000" : "#FFFFFF";
  const pending = theme === "light" ? "#DDDDDD" : "#222222";
  const active = "#EF4444";

  const cols = 15;
  const rows = Math.ceil(totalDays / cols);

  const dotRadius = Math.min(
    (width * 0.65) / (cols * 3),
    (height * 0.55) / (rows * 3),
  );

  const gap = dotRadius * 3.4;
  const gridWidth = (cols - 1) * gap;
  const gridHeight = (rows - 1) * gap;

  const dots: JSX.Element[] = [];
  let day = 1;

  for (let r = 0; r < rows && day <= totalDays; r++) {
    for (let c = 0; c < cols && day <= totalDays; c++) {
      let fill = pending;
      if (day < dayOfYear) fill = passed;
      if (day === dayOfYear) fill = active;

      dots.push(
        <circle
          key={day}
          cx={dotRadius + c * gap}
          cy={dotRadius + r * gap}
          r={dotRadius}
          fill={fill}
        />,
      );
      day++;
    }
  }

  const svgWidth = gridWidth + dotRadius * 2;
  const svgHeight = gridHeight + dotRadius * 2;

  const safeTop = height * 0.32;
  const safeBottom = height * 0.82;
  const safeHeight = safeBottom - safeTop;

  const gridTop = safeTop + (safeHeight - svgHeight) / 2;

  return new ImageResponse(
    <div
      style={{
        width,
        height,
        backgroundColor: bg,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={svgWidth}
        height={svgHeight}
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        style={{
          position: "absolute",
          top: gridTop,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        {dots}
      </svg>
      <div
        style={{
          position: "absolute",
          top: gridTop + svgHeight + dotRadius * 5,
          display: "flex",
          color: passed,
          fontSize: Math.round(width * 0.038),
          fontFamily: "system-ui, -apple-system",
        }}
      >
        {dayOfYear} / {totalDays} days
      </div>
      <div
        style={{
          position: "absolute",
          top: gridTop + svgHeight + dotRadius * 10,
          display: "flex",
          color: active,
          fontSize: Math.round(width * 0.028),
          fontFamily: "system-ui, -apple-system",
        }}
      >
        {percent}% complete ({daysLeft} days left)
      </div>
    </div>,
    { width, height },
  );
}
