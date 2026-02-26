type RouteAccessProps = {
  [key: string]: string[];
};

export const routeAccess: RouteAccessProps = {
  "/admin(.*)": ["admin"],
  "/professional(.*)": ["professional", "admin"],
  "/record/professional(.*)": ["professional", "admin"],
};