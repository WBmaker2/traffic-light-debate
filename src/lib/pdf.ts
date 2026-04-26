import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { calculateStats, getStanceLabel } from "./stats";
import type { DebatePost, DebateRoom } from "../types";

export async function exportRoomPdf(room: DebateRoom, posts: DebatePost[]): Promise<void> {
  const container = document.createElement("section");
  container.className = "pdf-sheet";
  const stats = calculateStats(posts);
  container.innerHTML = `
    <h1>${escapeHtml(room.topic)}</h1>
    <p class="pdf-meta">세션 코드: ${escapeHtml(room.sessionCode)} · 저장일: ${new Date().toLocaleString("ko-KR")}</p>
    <div class="pdf-stats">
      <span>찬성 ${stats.agree.count}명 (${stats.agree.percent}%)</span>
      <span>반대 ${stats.disagree.count}명 (${stats.disagree.percent}%)</span>
      <span>중립 ${stats.neutral.count}명 (${stats.neutral.percent}%)</span>
    </div>
    <h2>의견 목록</h2>
    <ol>
      ${posts
        .map(
          (post) => `
            <li>
              <strong>[${getStanceLabel(post.stance)}] ${escapeHtml(post.studentName)}</strong>
              <p>${escapeHtml(post.reason)}</p>
            </li>
          `,
        )
        .join("")}
    </ol>
  `;

  document.body.appendChild(container);
  const canvas = await html2canvas(container, {
    backgroundColor: "#ffffff",
    scale: 2,
  });
  document.body.removeChild(container);

  const pdf = new jsPDF("p", "mm", "a4");
  const imageData = canvas.toDataURL("image/png");
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageWidth = pageWidth - 20;
  const imageHeight = (canvas.height * imageWidth) / canvas.width;
  let heightLeft = imageHeight;
  let position = 10;

  pdf.addImage(imageData, "PNG", 10, position, imageWidth, imageHeight);
  heightLeft -= pageHeight - 20;

  while (heightLeft > 0) {
    pdf.addPage();
    position = heightLeft - imageHeight + 10;
    pdf.addImage(imageData, "PNG", 10, position, imageWidth, imageHeight);
    heightLeft -= pageHeight - 20;
  }

  pdf.save(`${sanitizeFileName(room.topic)}-${room.sessionCode}.pdf`);
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function sanitizeFileName(value: string): string {
  return value.replace(/[\\/:*?"<>|]/g, "_").slice(0, 40);
}
