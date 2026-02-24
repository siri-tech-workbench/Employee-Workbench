import { Box, Grid, Paper, Typography } from "@mui/material";
import { useState, useEffect } from "react";
import ProjectTeamForm from "./ProjectTeamForm";
import ProjectTeamTable from "./ProjectTeamTable";
import Loading from "../../../Components/loading";

/**
 * ProjectTeam
 *
 * Page-level component for managing project team members.
 * Handles:
 *  - Initial page load with a brief loading state
 *  - Edit state passed down to ProjectTeamForm for update flows
 *  - Refresh trigger to reload ProjectTeamTable after form submission
 */
export default function ProjectTeam() {
  const [editUser, setEditUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Increments refreshKey to signal ProjectTeamTable to re-fetch its data.
   * Called after a successful form save or update.
   */
  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  /**
   * Simulates an initial page load delay before showing content.
   * Replace the setTimeout with a real API prefetch call if needed.
   */
  useEffect(() => {
    const initLoad = async () => {
      try {
        await new Promise((r) => setTimeout(r, 300));
      } finally {
        setLoading(false);
      }
    };

    initLoad();
  }, []);

  return (
    <Box>
      {/* Show full-page loader during initial data fetch */}
      {loading && <Loading />}

      {/* Page header */}
      <Grid container spacing={2} mb={2}>
        <Grid size={12} component={Paper} p={2}>
          <Typography variant="h4" fontWeight={700} color="#6F60C1">
            Project Team
          </Typography>
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        {/* Form section — handles both create and edit modes */}
        <Grid size={12}>
          <ProjectTeamForm
            editUser={editUser}
            clearEdit={() => setEditUser(null)}
            onSuccess={triggerRefresh}
          />
        </Grid>

        {/* Table section — displays all team members, refreshes on data change */}
        <Grid size={12}>
          <ProjectTeamTable
            onEdit={(row) => setEditUser(row)}
            refreshKey={refreshKey}
          />
        </Grid>
      </Grid>
    </Box>
  );
}
