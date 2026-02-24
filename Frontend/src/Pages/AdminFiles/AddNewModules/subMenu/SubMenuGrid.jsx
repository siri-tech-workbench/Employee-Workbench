import React from "react";
import { IconButton, Tooltip } from "@mui/material";
import EditIcon from "@mui/icons-material/ModeEditOutlineRounded";
import { DataGrid } from "@mui/x-data-grid";
import DeleteIcon from "@mui/icons-material/Delete";

/**
 * SubMenuGrid
 * Displays the list of submenu records in a data grid
 * with inline edit and delete action buttons per row.
 *
 * Props:
 *   rows              - Array of submenu objects fetched from the API.
 *   onEdit            - Callback invoked with the row data when edit is clicked.
 *   onDelete          - Callback invoked with the row data when delete is clicked.
 *   getRowId          - Function to derive a unique row ID from each row object.
 *   loading           - Boolean flag to show the grid loading skeleton.
 *   rowHeight         - Height of each data row in pixels (default: 48).
 *   columnHeaderHeight - Height of the column header row in pixels (default: 40).
 */
export default function SubMenuGrid({
  rows = [],
  onEdit,
  onDelete,
  getRowId,
  loading,
  rowHeight = 48,
  columnHeaderHeight = 40,
}) {
  // Column definitions for the data grid.
  // The actions column uses renderCell to inject icon buttons instead of data values.
  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 110,
      sortable: false,
      filterable: false,
      headerAlign: "center",
      align: "center",
      renderCell: (params) => (
        <>
          {/* Edit button — triggers the parent edit handler with the row data */}
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => onEdit?.(params.row)}
              sx={{ p: 0.3 }}
            >
              <EditIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>

          {/* Delete button — triggers the parent delete handler with the row data */}
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => onDelete?.(params.row)}
              sx={{ p: 0.3, color: "red" }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </>
      ),
    },

    // Displays the submenu name returned from the API
    { field: "sub_menue_name", headerName: "Sub Menu Name", width: 170 },

    // Displays the icon identifier string associated with the submenu
    { field: "icon", headerName: "Icon", width: 150 },

    {
      field: "page_name_navigation",
      headerName: "Page",
      width: 150,
      // Renders the string "null" as-is if the value is explicitly null
      renderCell: (params) => (params.value === null ? "null" : params.value),
    },

    // Displays the parent menu item name this submenu belongs to
    { field: "menue_item_name", headerName: "Menu Items", width: 150 },

    // Displays the display order position of the submenu
    { field: "position", headerName: "Position", width: 100, type: "number" },
  ];

  return (
    <DataGrid
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={getRowId}
      rowHeight={rowHeight}
      columnHeaderHeight={columnHeaderHeight}
    />
  );
}
