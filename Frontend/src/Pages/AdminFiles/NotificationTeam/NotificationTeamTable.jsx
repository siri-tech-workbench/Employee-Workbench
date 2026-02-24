import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Grid,
  Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

/* Mock data for the employee list table */
const EmployeeRows = [
  { type: "Anurag" },
  { type: "Shesha chandrika Vyasarajapura" },
  { type: "Jashwanth" },
  { type: "Prajwal Jamkandi" },
];

/* Mock data for the team summary table */
const TeamRows = [
  { teamName: "Marketing", teamSize: "3" },
  { teamName: "Design", teamSize: "2" },
  { teamName: "Development", teamSize: "10" },
  { teamName: "Testing", teamSize: "4" },
];

export default function NotificationTeamTable() {
  return (
    <Grid container spacing={2} mb={2}>
      {/* ================= TEAM LIST SECTION ================= */}
      {/* Displays general team overview with action buttons and sizing */}
      <Grid xs={12} md={6} component={Paper} p={2}>
        <Typography variant="h6" fontWeight={700} color="#6F60C1">
          Team List
        </Typography>

        <Paper
          sx={{
            borderRadius: 3,
            mt: 2,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
          }}
        >
          {/* Scrollable container for the Team Table */}
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell>Action</TableCell>
                  <TableCell>Team Name</TableCell>
                  <TableCell>Team Size</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {TeamRows.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={(theme) => ({
                      /* Zebra striping for rows based on theme mode */
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.mode === "dark"
                            ? "#1f1f2b"
                            : "#e8f4ff"
                          : theme.palette.mode === "dark"
                            ? "#29293a"
                            : "#ffe6eb",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                        cursor: "pointer",
                      },
                    })}
                  >
                    <TableCell>
                      <EditIcon
                        sx={{ color: "blue", cursor: "pointer", mr: 1 }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      {row.teamName}
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>
                      {row.teamSize}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>

      {/* ================= EMPLOYEE LIST SECTION ================= */}
      {/* Displays specific members belonging to a selected team (e.g., Marketing) */}
      <Grid xs={12} md={6} component={Paper} p={2}>
        <Typography variant="h6" fontWeight={700} color="#6F60C1">
          Employee - Marketing List
        </Typography>

        <Paper
          sx={{
            borderRadius: 3,
            mt: 2,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
          }}
        >
          {/* Scrollable container for the Employee Table */}
          <TableContainer sx={{ maxHeight: 350 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell>Action</TableCell>
                  <TableCell>Employee Name</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {EmployeeRows.map((row, index) => (
                  <TableRow
                    key={index}
                    sx={(theme) => ({
                      /* Zebra striping logic mirrored from Team List */
                      backgroundColor:
                        index % 2 === 0
                          ? theme.palette.mode === "dark"
                            ? "#1f1f2b"
                            : "#e8f4ff"
                          : theme.palette.mode === "dark"
                            ? "#29293a"
                            : "#ffe6eb",
                      "&:hover": {
                        backgroundColor:
                          theme.palette.mode === "dark" ? "#33334a" : "#e5e5e5",
                        cursor: "pointer",
                      },
                    })}
                  >
                    <TableCell>
                      <DeleteIcon
                        sx={{ color: "red", cursor: "pointer", fontSize: 22 }}
                      />
                    </TableCell>

                    <TableCell sx={{ fontWeight: 700 }}>{row.type}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );
}
