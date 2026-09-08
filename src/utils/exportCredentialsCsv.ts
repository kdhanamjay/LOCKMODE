import { Device } from '../types/mdm';

/**
 * Exports all workstation and device login credentials to a clean,
 * UTF-8 CSV file formatted for Microsoft Excel, Google Sheets, or school audits.
 */
export function exportDeviceCredentialsCsv(devices: Device[]) {
  const headers = [
    'Device ID',
    'Device Name',
    'Platform',
    'Student Username',
    'Default Station Password',
    'MAC Address',
    'IP Address',
    'Assigned Student',
    'Roll Number',
    'Class',
    'School',
    'Status',
    'Kiosk Mode',
    'Lock State',
    'Enrollment Date',
  ];

  const escapeCsv = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = devices.map((d) => {
    const studentUser =
      d.studentUsername ||
      (d.assignedStudentName
        ? d.assignedStudentName.toLowerCase().replace(/\s+/g, '.')
        : `student.${d.deviceId.toLowerCase().replace(/[^a-z0-9]/g, '')}`);
    const defaultPass = d.defaultPassword || 'EG-2026';
    const mac = d.macAddress || '00:1A:2B:XX:XX:XX';

    return [
      escapeCsv(d.deviceId),
      escapeCsv(d.name),
      escapeCsv(d.platform),
      escapeCsv(studentUser),
      escapeCsv(defaultPass),
      escapeCsv(mac),
      escapeCsv(d.ipAddress || '192.168.1.X'),
      escapeCsv(d.assignedStudentName || 'Unassigned'),
      escapeCsv(d.assignedStudentRoll || '-'),
      escapeCsv(d.className || '-'),
      escapeCsv(d.schoolName || '-'),
      escapeCsv(d.status),
      escapeCsv(d.kioskMode),
      escapeCsv(d.isLocked ? 'LOCKED' : 'UNLOCKED'),
      escapeCsv(d.enrollmentDate ? new Date(d.enrollmentDate).toLocaleDateString() : '-'),
    ].join(',');
  });

  // Include UTF-8 Byte Order Mark (\uFEFF) for immediate compatibility with Excel & Sheets
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `eduguard_workstation_passwords_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
