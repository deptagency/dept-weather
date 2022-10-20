export default function CardDetail({
  iconImgSrc,
  value,
  secondaryValue,
  label
}: {
  value?: string;
  secondaryValue?: string;
  iconImgSrc?: string;
  label?: string;
}) {
  return (
    <div style={{ flexGrow: '0', width: '12rem', margin: '1rem 0rem' }}>
      <p style={{ margin: '0rem', fontSize: '2rem', fontWeight: '400' }}>{value}</p>
      {secondaryValue ? (
        <p style={{ margin: '0.25rem 0rem 0rem', fontSize: '1rem', fontWeight: '400' }}>{secondaryValue}</p>
      ) : (
        <></>
      )}
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '0.5rem' }}>
        {iconImgSrc ? (
          <img src={iconImgSrc} style={{ height: '1rem', objectFit: 'scale-down', marginRight: '0.25rem' }}></img>
        ) : (
          <></>
        )}
        <p style={{ margin: '0rem', fontSize: '1rem', fontWeight: '700' }}>{label}</p>
      </div>
    </div>
  );
}
