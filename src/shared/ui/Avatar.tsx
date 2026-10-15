function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(p => p.length > 0);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.substring(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xff;
    color += ('00' + value.toString(16)).slice(-2);
  }
  return color;
}

export function Avatar({ name, size = 32 }: Readonly<{ name: string; size?: number }>) {
  const initials = getInitials(name);
  const bgColor = stringToColor(name);
  
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `linear-gradient(135deg, ${bgColor}88 0%, ${bgColor} 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: size * 0.4,
        flexShrink: 0,
        textShadow: '0px 1px 2px rgba(0,0,0,0.3)'
      }}
    >
      {initials}
    </div>
  );
}
