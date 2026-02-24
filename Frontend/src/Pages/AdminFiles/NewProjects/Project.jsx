import { Box, Button, Grid, Paper, Typography } from "@mui/material";
import ProjectsForm from "./ProjectsForm";
import ProjectsTable from "./ProjectsTable";
import { useState, useEffect } from "react";
import Loading from "../../../Components/loading";

export default function Customer() {
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this customer?")) return;

    await deletecustomer(id);
    triggerRefresh();
  };
  useEffect(() => {
    const initLoad = async () => {
      try {
        // initial page load delay (optional)
        await new Promise((r) => setTimeout(r, 300));
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, []);

  return (
    <Box>
      {loading && <Loading />}
      <Grid container spacing={2} mb={2}>
        <Grid
          size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}
          component={Paper}
          p={2}
        >
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Project
          </Typography>
        </Grid>
      </Grid>
      {/* ========== */}
      <Grid container spacing={2}>
        {/* Employee Entry Form */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <ProjectsForm
            editUser={editUser}
            clearEdit={() => setEditUser(null)}
            onSuccess={triggerRefresh}
          />
        </Grid>
        {/* Employee Table */}
        <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12, xl: 12 }}>
          <ProjectsTable
            onEdit={(row) => setEditUser(row)}
            refreshKey={refreshKey}
            onDelete={handleDelete}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
