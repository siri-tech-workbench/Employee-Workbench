import { Box, Grid } from "@mui/material";
import PermissionList from "./PermissionList";
import PermissionDetails from "./PermissionDetails";

/**
 * PermissionA
 * Layout component for the Permission management screen.
 * Renders the permission list form on the left
 * and the permission details panel on the right.
 */
export default function PermissionA() {
  return (
    <Box>
      <Grid container spacing={2}>
        {/* Permission request form */}
        <Grid size={{ xs: 12, sm: 12, md: 5 }}>
          <PermissionList />
        </Grid>

        {/* Permission details and history */}
        <Grid size={{ xs: 12, sm: 12, md: 7 }}>
          <PermissionDetails />
        </Grid>
      </Grid>
    </Box>
  );
}
