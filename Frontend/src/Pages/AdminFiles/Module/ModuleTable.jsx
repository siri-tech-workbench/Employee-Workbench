import { useEffect, useState } from "react";
import {
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";

import { getmodulesdata } from "../../../Services/module.service";
import Loading from "../../../Components/loading";
import { showPostError } from "../../../Components/swal_alert";

/**
 * ModuleTable
 *
 * Displays module list and allows edit action.
 */
export default function ModuleTable({ onEdit, refreshKey }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(false);

  /* -------------------------------------------------------
     Fetch Modules
  ------------------------------------------------------- */
  const fetchModules = async () => {
    try {
      setLoading(true);

      const res = await getmodulesdata();

      setModules(Array.isArray(res?.items) ? res.items : []);
    } catch (error) {
      console.error("Failed to fetch modules", error);

      setModules([]);
      showPostError("Failed to load modules");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------------------------------------------
     Refresh on key change
  ------------------------------------------------------- */
  useEffect(() => {
    fetchModules();
  }, [refreshKey]);

  /* -------------------------------------------------------
     Render
  ------------------------------------------------------- */
  return (
    <>
      {loading && <Loading />}

      <Paper
        sx={{
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 3px 15px rgba(0,0,0,0.10)",
        }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow
              sx={{
                backgroundColor: (theme) =>
                  theme.palette.mode === "dark" ? "#2c2c3d" : "#ececec",
                "& th": {
                  fontWeight: 700,
                },
              }}
            >
              <TableCell width={80}>Action</TableCell>
              <TableCell>Module Name</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {modules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} align="center">
                  No modules found
                </TableCell>
              </TableRow>
            ) : (
              modules.map((row) => (
                <TableRow
                  key={row.MODULE_ID}
                  sx={{
                    "&:nth-of-type(even)": {
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#1c1c2a" : "#f4f4f4",
                    },
                    "&:hover": {
                      backgroundColor: (theme) =>
                        theme.palette.mode === "dark" ? "#26263c" : "#e7e7e7",
                    },
                  }}
                >
                  <TableCell>
                    <EditIcon
                      sx={{
                        color: "#6F60C1",
                        cursor: "pointer",
                      }}
                      onClick={() => onEdit?.(row)}
                    />
                  </TableCell>

                  <TableCell
                    sx={{
                      fontWeight: 600,
                    }}
                  >
                    {row.module_name}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </>
  );
}
