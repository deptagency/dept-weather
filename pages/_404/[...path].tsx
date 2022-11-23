export const Custom404 = () => <></>;

export const getServerSideProps = () => {
  return { redirect: { destination: '/', permanent: false } };
};

export default Custom404;
