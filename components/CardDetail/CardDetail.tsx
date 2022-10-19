export default function CardDetail({
  iconImgSrc,
  value,
  label
}: {
  value?: string;
  iconImgSrc?: string;
  label?: string;
}) {
  return (
    <div style={{ flex: '50%', marginBottom: '2rem' }}>
      <p style={{ margin: '0rem', fontSize: '2rem', fontWeight: '400' }}>{value}</p>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={iconImgSrc} style={{ height: '1rem', objectFit: 'scale-down', marginRight: '0.25rem' }}></img>
        <p style={{ margin: '0rem', fontSize: '1rem', fontWeight: '400' }}>{label}</p>
      </div>
    </div>
  );
}
