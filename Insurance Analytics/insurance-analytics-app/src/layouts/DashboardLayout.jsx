import { Outlet } from "react-router-dom";

export default function DashboardLayout() {
  return (
    <div style={styles.layoutWrapper}>
      <Outlet />
    </div>
  );
}

const styles = {
  layoutWrapper: {
    minHeight: "100vh",
    backgroundColor: "#f8f9fb",
  },
};
