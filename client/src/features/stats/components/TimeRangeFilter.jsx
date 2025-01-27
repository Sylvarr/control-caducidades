import PropTypes from "prop-types";
import { Button } from "../../../shared/components/Button";
import { Menu } from "../../../shared/components/Menu";
import { Calendar, X } from "lucide-react";

const PRESET_RANGES = [
  {
    label: "Últimas 24 horas",
    value: "24h",
    getRange: () => ({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: "Última semana",
    value: "7d",
    getRange: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: "Último mes",
    value: "30d",
    getRange: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
  {
    label: "Últimos 3 meses",
    value: "90d",
    getRange: () => ({
      start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
    }),
  },
];

export const TimeRangeFilter = ({ value, onChange, onClear }) => {
  // Encontrar el rango preestablecido activo
  const activePreset = PRESET_RANGES.find(
    (preset) =>
      preset.getRange().start === value?.start &&
      preset.getRange().end === value?.end
  );

  // Generar items del menú
  const menuItems = PRESET_RANGES.map((preset) => ({
    label: preset.label,
    onClick: () => onChange(preset.getRange()),
    active: preset.value === activePreset?.value,
  }));

  return (
    <div className="flex gap-2">
      <Menu
        trigger={
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            {activePreset?.label || "Rango personalizado"}
          </Button>
        }
        items={menuItems}
      />

      {value && (
        <Button variant="ghost" onClick={onClear}>
          <X className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};

TimeRangeFilter.propTypes = {
  value: PropTypes.shape({
    start: PropTypes.string.isRequired,
    end: PropTypes.string.isRequired,
  }),
  onChange: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
};

export default TimeRangeFilter;
