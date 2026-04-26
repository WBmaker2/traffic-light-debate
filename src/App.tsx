import { useEffect, useMemo, useState } from "react";
import { Home } from "./components/Home";
import { StudentJoin } from "./components/StudentJoin";
import { StudentRoom } from "./components/StudentRoom";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { TeacherRoom } from "./components/TeacherRoom";

type Route =
  | { name: "home" }
  | { name: "teacher" }
  | { name: "teacherRoom"; roomId: string }
  | { name: "studentJoin"; code?: string }
  | { name: "studentRoom"; roomId: string };

export default function App() {
  const [pathname, setPathname] = useState(window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const route = useMemo(() => parseRoute(stripBasePath(pathname)), [pathname]);

  function navigate(path: string) {
    const nextPath = withBasePath(path);
    window.history.pushState({}, "", nextPath);
    setPathname(nextPath);
  }

  switch (route.name) {
    case "teacher":
      return <TeacherDashboard navigate={navigate} />;
    case "teacherRoom":
      return <TeacherRoom roomId={route.roomId} navigate={navigate} />;
    case "studentJoin":
      return <StudentJoin initialCode={route.code} navigate={navigate} />;
    case "studentRoom":
      return <StudentRoom roomId={route.roomId} />;
    case "home":
    default:
      return <Home navigate={navigate} />;
  }
}

function parseRoute(pathname: string): Route {
  const parts = pathname.split("/").filter(Boolean);

  if (parts[0] === "teacher" && parts[1] === "rooms" && parts[2]) {
    return { name: "teacherRoom", roomId: parts[2] };
  }

  if (parts[0] === "teacher") {
    return { name: "teacher" };
  }

  if (parts[0] === "join" && parts[1]) {
    return { name: "studentJoin", code: parts[1] };
  }

  if (parts[0] === "student" && parts[1] === "rooms" && parts[2]) {
    return { name: "studentRoom", roomId: parts[2] };
  }

  if (parts[0] === "student") {
    return { name: "studentJoin" };
  }

  return { name: "home" };
}

function stripBasePath(pathname: string): string {
  const basePath = getBasePath();
  if (!basePath || !pathname.startsWith(basePath)) {
    return pathname;
  }

  return pathname.slice(basePath.length) || "/";
}

function withBasePath(path: string): string {
  const basePath = getBasePath();
  if (!basePath) {
    return path;
  }

  return `${basePath}${path === "/" ? "" : path}`;
}

function getBasePath(): string {
  return import.meta.env.BASE_URL.replace(/\/$/, "");
}
