import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Box,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

import { useEffect, useState } from "react";
import {
  getprojecttabledata,
  deleteproject,
} from "../../../Services/project.service";

import Loading from "../../../Components/loading";
import {
  deleteAlert,
  showPostError,
  showAlert,
} from "../../../Components/swal_alert";

export default function ProjectsTable({ onEdit, refreshKey }) {
  const [projectRows, setProjectRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     Fetch Projects
  ================================ */
  useEffect(() => {
    fetchProjects();
  }, [refreshKey]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await getprojecttabledata();
      setProjectRows(res?.items || []);
    } catch (err) {
      console.error("Failed to load projects", err);
      showPostError("Failed to load projects");
      setProjectRows([]);
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Delete Project
  ================================ */
  const handleDelete = async (projectId) => {
    const confirmDelete = await deleteAlert(
      "warning",
      "Are you sure you want to delete this project?",
      {
        showCancelButton: true,
        confirmButtonText: "Yes, delete",
      },
    );

    if (!confirmDelete?.isConfirmed) return;

    try {
      setLoading(true);

      const response = await deleteproject(projectId);

      if (response?.Status === 1 || response?.statusCode === 200) {
        await showAlert("success", "Project deleted successfully");
        fetchProjects();
      } else {
        showPostError(response?.message || "Project deletion failed");
      }
    } catch (err) {
      console.error("Delete failed", err);
      showAlert(
        "error",
        err?.response?.data?.message || "Something went wrong",
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     Date Formatter
  ================================ */
  const formatDate = (date) => {
    if (!date) return "-";

    const d = new Date(date);
    return `${String(d.getDate()).padStart(2, "0")}-${String(
      d.getMonth() + 1,
    ).padStart(2, "0")}-${d.getFullYear()}`;
  };

  return (
    <>
      {loading && <Loading />}

      <Paper sx={{ p: 2 }}>
        <Box
          sx={{
            borderRadius: 3,
            overflow: "hidden",
            background: (theme) =>
              theme.palette.mode === "dark" ? "#14141f" : "#ffffff",
            boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
          }}
        >
          <TableContainer sx={{ maxHeight: 300 }}>
            <Table size="small" stickyHeader>
              {/* ================= HEADER ================= */}
              <TableHead>
                <TableRow
                  sx={{
                    backgroundColor: (theme) =>
                      theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                    "& th": { fontWeight: 700 },
                  }}
                >
                  <TableCell width={100}>Action</TableCell>
                  <TableCell>Project Name</TableCell>
                  <TableCell>PO Number</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Project Leader</TableCell>
                </TableRow>
              </TableHead>

              {/* ================= BODY ================= */}
              <TableBody>
                {projectRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No projects found
                    </TableCell>
                  </TableRow>
                ) : (
                  projectRows.map((row, index) => (
                    <TableRow
                      key={row.project_id}
                      sx={(theme) => ({
                        backgroundColor:
                          theme.palette.mode === "dark"
                            ? index % 2 === 0
                              ? "#1f1f2b"
                              : "#29293a"
                            : index % 2 === 0
                              ? "#e8f4ff"
                              : "#ffe6eb",
                        "&:hover": {
                          backgroundColor:
                            theme.palette.mode === "dark"
                              ? "#3a3a50"
                              : "#e5e5e5",
                        },
                      })}
                    >
                      <TableCell>
                        <EditIcon
                          sx={{ color: "#1976d2", cursor: "pointer", mr: 1 }}
                          onClick={() => onEdit?.(row)}
                        />
                        <DeleteIcon
                          sx={{ color: "#d32f2f", cursor: "pointer" }}
                          onClick={() => handleDelete(row.project_id)}
                        />
                      </TableCell>

                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.project_name}
                      </TableCell>

                      <TableCell>{row.ponumber}</TableCell>
                      <TableCell>{row.customer_name}</TableCell>

                      <TableCell>{formatDate(row.start_date)}</TableCell>

                      <TableCell>{formatDate(row.end_date)}</TableCell>

                      <TableCell sx={{ fontWeight: 600 }}>
                        {row.leader_name}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Paper>
    </>
  );
}
