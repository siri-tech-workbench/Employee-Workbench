import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Tabs,
  Tab,
  Paper,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useNavigate } from "react-router-dom";
import { getLoginDetails } from "../../../Services/login.service";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import BeachAccessIcon from "@mui/icons-material/BeachAccess";
import TimerOffIcon from "@mui/icons-material/TimerOff";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import WorkIcon from "@mui/icons-material/Work";
import HomeIcon from "@mui/icons-material/Home";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import { DataGrid } from "@mui/x-data-grid";
import { decryptData } from "../../../utils/secureStorage";
import { getpendingcompoffs } from "../../../Services/approvecompoff.service";
import { getprojecttabledata } from "../../../Services/project.service";
import { getemployeetodayleavedetails } from "../../../Services/leave.services";
import { gettodayspermission } from "../../../Services/permission.services";
import dayjs from "dayjs";

/**
 * AdminDashboard
 * Renders the admin home screen with summary stat cards,
 * a meeting panel, and a login overview table with date navigation.
 */
export default function AdminDashboard() {
  const [tab, setTab] = useState(0);
  const [rows, setRows] = useState([]);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [pendingCompoffCount, setPendingCompoffCount] = useState(0);
  const [projectCount, setProjectCount] = useState(0);
  const [todayLeavesCount, setTodayLeavesCount] = useState(0);
  const [todayPermissionCount, setTodayPermissionCount] = useState(0);

  const navigate = useNavigate();

  /**
   * Fetches login activity records for the given date
   * and populates the login overview grid.
   */
  const fetchLoginDetailsByDate = async (date) => {
    try {
      const formattedDate = date.format("YYYY-MM-DD");
      const res = await getLoginDetails(formattedDate);
      setRows(res?.items || []);
    } catch (err) {
      console.error("Login fetch error:", err);
      setRows([]);
    }
  };

  /**
   * Fetches the count of pending comp-off requests
   * for the comp-off stat card.
   */
  const fetchPendingCompoffs = async () => {
    const compoffRes = await getpendingcompoffs();
    setPendingCompoffCount(compoffRes?.items?.length || 0);
  };

  /**
   * Fetches the total project count
   * for the projects stat card.
   */
  const fetchProjectCount = async () => {
    const projectRes = await getprojecttabledata();
    setProjectCount(projectRes?.items?.length || 0);
  };

  /**
   * Fetches today's leave records and updates
   * the leaves stat card count.
   */
  const fetchTodayLeaves = async () => {
    try {
      const res = await getemployeetodayleavedetails();
      setTodayLeavesCount(res.items.length);
    } catch (err) {
      console.error("Today leaves fetch error:", err);
      setTodayLeavesCount(0);
    }
  };

  /**
   * Fetches all permissions and filters to today's date
   * for the permission stat card count.
   */
  const fetchTodayPermissions = async () => {
    try {
      const res = await gettodayspermission();
      const permissions = Array.isArray(res?.items) ? res.items : [];
      const today = dayjs().startOf("day");

      const count = permissions.filter((perm) => {
        const permDate = dayjs(perm.PERMISSION_DATE).startOf("day");
        return permDate.isValid() && today.isSame(permDate);
      }).length;

      setTodayPermissionCount(count);
    } catch (err) {
      console.error("Today permission fetch error:", err);
      setTodayPermissionCount(0);
    }
  };

  // Reload login details whenever the selected date changes.
  // All other stat counts are date-independent and fetched once.
  useEffect(() => {
    const init = async () => {
      try {
        await fetchLoginDetailsByDate(selectedDate);
        await fetchPendingCompoffs();
        await fetchProjectCount();
        await fetchTodayLeaves();
        await fetchTodayPermissions();
      } catch (err) {
        console.error("Dashboard init error:", err);
      }
    };

    init();
  }, [selectedDate]);

  /**
   * Stat card configuration for the summary section.
   * Note: Tasks (72) and Break (0) are placeholder values pending API integration.
   * Note: Tickets value ("-") is intentional until the tickets API is connected.
   */
  const stats = [
    {
      label: "Projects",
      value: projectCount,
      icon: <MonetizationOnIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/Project"),
    },
    {
      label: "Tasks",
      value: 72,
      icon: <AssignmentIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/Newtask"),
    },
    {
      label: "Leaves",
      value: todayLeavesCount,
      icon: <BeachAccessIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/PendingLeaves"),
    },
    {
      label: "Comp-Off",
      value: pendingCompoffCount,
      icon: <TimerOffIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/compoffleave"),
    },
    {
      label: "Tickets",
      value: "-",
      icon: <ConfirmationNumberIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/Tickets"),
    },
    {
      label: "Break",
      value: 0,
      icon: <TimerOffIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/Break"),
    },
    {
      label: "Permission",
      value: todayPermissionCount,
      icon: <ExitToAppIcon sx={{ fontSize: 35, color: "#6f60c1" }} />,
      onClick: () => navigate("/Drawer/PermissionA"),
    },
  ];

  /**
   * Column definitions for the login overview DataGrid.
   * Status cell renders different icons based on login state.
   */
  const columns = [
    {
      field: "name",
      headerName: "Name",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "status",
      headerName: "Login Type",
      flex: 1,
      minWidth: 180,
      align: "center",
      headerAlign: "center",
      renderCell: (params) => {
        const row = params.row;

        return (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              width: "100%",
              height: "100%",
            }}
          >
            {row.status === "LOGGED_IN" && (
              <>
                {row.login_type === "Home" && (
                  <HomeIcon sx={{ color: "#ff9800" }} />
                )}
                {row.login_type === "Siri Office" && (
                  <WorkIcon sx={{ color: "success.main" }} />
                )}
                {row.login_type === "Client Office" && (
                  <LocationOnIcon sx={{ color: "error.light" }} />
                )}
                <Typography variant="body2">{row.login_type}</Typography>
              </>
            )}

            {row.status === "ON_LEAVE" && (
              <>
                <BeachAccessIcon sx={{ color: "#1976d2" }} />
                <Typography variant="body2">On Leave</Typography>
              </>
            )}

            {row.status !== "LOGGED_IN" && row.status !== "ON_LEAVE" && (
              <>
                <ExitToAppIcon sx={{ color: "error.main" }} />
                <Typography variant="body2">Not Logged In</Typography>
              </>
            )}
          </Box>
        );
      },
    },
    {
      field: "login_time",
      headerName: "Login Time",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => params.value || "",
    },
    {
      field: "logout_time",
      headerName: "Logout Time",
      flex: 1,
      minWidth: 140,
      renderCell: (params) => params.value || "",
    },
    {
      field: "work_duration",
      headerName: "Work Duration",
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.value || "",
    },
  ];

  // Map rows using index as id since login records have no unique ID from the backend
  const gridRows = rows.map((row, index) => ({ id: index, ...row }));

  return (
    <Box>
      {/* Page header with title and orange accent bar */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" fontWeight={700} color="#6964C1">
          Welcome Admin !
        </Typography>
        <Box sx={{ height: 3, background: "#FF7A00", mt: 1 }} />
      </Box>

      {/* Summary stat cards */}
      <Grid container spacing={3} sx={{ mb: 2 }}>
        {stats.map((s, i) => (
          <Grid size={{ xs: i === 4 ? 12 : 6, sm: 6, md: 2 }} key={i}>
            <Card
              onClick={s.onClick}
              sx={{
                borderRadius: 3,
                height: "90px",
                border: "2px solid #6F60C1",
                boxShadow: "0 2px 10px rgba(0,0,0,0.15)",
                transition: "0.2s",
                cursor: s.onClick ? "pointer" : "default",
                "&:hover": { transform: "translateY(-4px)" },
              }}
            >
              <CardContent sx={{ display: "flex", alignItems: "center" }}>
                <Box sx={{ fontSize: 40, color: s.color, mr: 3 }}>{s.icon}</Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>
                    {s.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {s.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Meeting panel with today and previous tabs */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card
            sx={{
              borderRadius: 3,
              p: 2,
              height: "100%",
              border: "2px solid #6F60C1",
            }}
          >
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Meeting
            </Typography>

            <Tabs
              value={tab}
              onChange={(e, v) => setTab(v)}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                "& .Mui-selected": { color: "#6F60C1" },
                "& .MuiTabs-indicator": { backgroundColor: "#6F60C1" },
              }}
            >
              <Tab label="TODAY'S MEETING" />
              <Tab label="PREVIOUS MEETING" />
            </Tabs>

            <Box sx={{ mt: 2, color: "text.secondary" }}>
              No meetings available.
            </Box>
          </Card>
        </Grid>

        {/* Login overview panel with date navigation */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ borderRadius: 3, p: 2, border: "2px solid #6F60C1" }}>
            {/* Date header with previous and today navigation */}
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6" fontWeight={700}>
                Login Overview – {selectedDate.format("DD MMM YYYY")}
              </Typography>

              <Box sx={{ display: "flex", gap: 1 }}>
                <Typography
                  role="button"
                  tabIndex={0}
                  sx={{ cursor: "pointer", color: "#6F60C1", fontWeight: 600 }}
                  onClick={() =>
                    setSelectedDate((prev) => prev.subtract(1, "day"))
                  }
                >
                  Previous
                </Typography>

                {/* Only show Today button when not already on today */}
                {!selectedDate.isSame(dayjs(), "day") && (
                  <Typography
                    role="button"
                    tabIndex={0}
                    sx={{
                      cursor: "pointer",
                      color: "#6F60C1",
                      fontWeight: 600,
                    }}
                    onClick={() => setSelectedDate(dayjs())}
                  >
                    Today
                  </Typography>
                )}
              </Box>
            </Box>

            {/* Login overview data grid */}
            <Paper sx={{ height: 380, borderRadius: 3 }}>
              <DataGrid
                rows={gridRows}
                columns={columns}
                hideFooter
                pageSizeOptions={[5, 10, 20]}
                initialState={{
                  pagination: { paginationModel: { pageSize: 10 } },
                }}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    backgroundColor: "#f5f5f5",
                    fontWeight: 700,
                  },
                  "& .MuiDataGrid-row:hover": {
                    backgroundColor: "#f0f0ff",
                  },
                }}
              />
            </Paper>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
