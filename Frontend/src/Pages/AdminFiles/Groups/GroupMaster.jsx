import { useState } from "react";
import { Grid } from "@mui/material";

import GroupMasterForm from "./GroupMasterForm";
import GroupMasterGrid from "./GroupMasterGrid";

/**
 * GroupMaster Component
 *
 * Responsibilities:
 * - Manages selected row state
 * - Handles grid refresh trigger
 * - Coordinates Form and Grid communication
 */
export default function GroupMaster() {
  const [selectedRow, setSelectedRow] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  /**
   * Triggers grid refresh
   * Increments refreshKey to re-fetch grid data
   */
  const handleRefreshGrid = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <Grid container spacing={2}>
      {/* Form Section */}
      <Grid size={{ xs: 12, sm: 12, md: 12 }}>
        <GroupMasterForm
          selectedRow={selectedRow}
          clearSelection={() => setSelectedRow(null)}
          refreshGrid={handleRefreshGrid}
        />
      </Grid>

      {/* Grid Section */}
      <Grid size={{ xs: 12, sm: 12, md: 12 }}>
        <GroupMasterGrid
          onEdit={setSelectedRow}
          refreshKey={refreshKey}
          refreshGrid={handleRefreshGrid}
        />
      </Grid>
    </Grid>
  );
}
