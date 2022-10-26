import { AirNowObservations } from '../../../../models/api';
import Measurement from '../Measurement';

const AirQualityIcon = () => (
  <svg aria-hidden="true" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.99801 15.9987C7.72201 15.9987 7.49801 15.7747 7.49801 15.4987V12.7427C7.09601 12.914 6.67334 13.0007 6.23934 13.0007C5.86201 13.0007 5.48801 12.934 5.12867 12.802C4.40267 12.536 3.80267 12.0233 3.42734 11.3527C2.30467 11.0407 1.35134 10.2333 0.864006 9.17333C0.418006 8.20467 0.376673 7.12 0.746006 6.12C1.07134 5.24 1.69001 4.50867 2.49801 4.04467C2.49734 4.006 2.49734 3.96733 2.49801 3.92867C2.50867 3.26867 2.77534 2.65333 3.24934 2.194C3.69201 1.76533 4.26734 1.52067 4.87934 1.5C5.12401 1.19333 5.41201 0.924667 5.73734 0.701334C6.40667 0.240667 7.18601 -0.00266647 7.99067 -0.00266647C8.23534 -0.00266647 8.48267 0.0200002 8.72534 0.0653335C9.67534 0.241334 10.5207 0.749333 11.1193 1.50067C11.2467 1.50533 11.368 1.51867 11.4873 1.54133C12.6807 1.766 13.536 2.84733 13.4987 4.04533C14.734 4.756 15.496 6.064 15.4993 7.498C15.4987 9.274 14.2733 10.876 12.5693 11.3513C12.468 11.532 12.35 11.7027 12.216 11.8607C11.6033 12.5833 10.7073 12.9973 9.75667 12.9973C9.32267 12.9973 8.89467 12.91 8.49867 12.742V15.4987C8.49801 15.7747 8.27401 15.9987 7.99801 15.9987ZM4.96934 2.49867C4.58401 2.49867 4.22001 2.646 3.94467 2.91267C3.66267 3.186 3.50401 3.552 3.49801 3.94467C3.49667 4.04333 3.50467 4.14267 3.52334 4.24C3.56601 4.466 3.45001 4.69067 3.24067 4.78667C2.51467 5.12067 1.96201 5.71733 1.68467 6.46733C1.40734 7.21733 1.43867 8.03 1.77334 8.756C2.16667 9.61133 2.95201 10.238 3.87267 10.4327C4.02601 10.4653 4.15667 10.5693 4.22267 10.7113C4.47201 11.25 4.91601 11.6587 5.47334 11.8633C5.72134 11.954 5.97934 12.0007 6.23934 12.0007C6.56134 12.0007 6.87534 11.9313 7.17201 11.7933C7.28401 11.7413 7.39334 11.6787 7.49867 11.606V8.478C6.14001 8.31 5.08334 7.20267 4.99934 5.81333C4.99267 5.69867 4.99267 5.58267 4.99934 5.46867C5.01534 5.20533 5.23534 4.99867 5.49934 4.99867C5.50401 4.99867 5.52201 4.99933 5.52667 4.99933C5.66134 5.00733 5.78334 5.06667 5.87201 5.16667C5.96067 5.26667 6.00467 5.39533 5.99667 5.52867C5.99201 5.60333 5.99201 5.67867 5.99667 5.75333C6.04867 6.612 6.67534 7.30867 7.49734 7.468V5.49867C7.49734 5.22267 7.72134 4.99867 7.99734 4.99867C8.27267 4.99867 8.49734 5.22267 8.49734 5.49867V9.47067C9.86001 9.322 10.4973 8.53067 10.4973 6.99867C10.4973 6.72267 10.7213 6.49867 10.9973 6.49867C11.2733 6.49867 11.4973 6.72267 11.4973 6.99867C11.4973 9.074 10.4347 10.3 8.49734 10.474V11.6033C8.86867 11.8607 9.30267 11.996 9.75867 11.996C10.4127 11.996 11.03 11.7113 11.4513 11.214C11.5807 11.0613 11.6887 10.892 11.7727 10.71C11.8393 10.568 11.97 10.4633 12.1227 10.4313C13.498 10.1387 14.4967 8.90533 14.4973 7.49933C14.4947 6.33733 13.8107 5.27267 12.7547 4.78667C12.546 4.69067 12.43 4.466 12.472 4.24C12.5447 3.85467 12.4627 3.464 12.2407 3.13933C12.0187 2.81467 11.6847 2.596 11.3 2.524C11.2107 2.50733 11.1207 2.49867 11.0327 2.49867H11.006C10.9667 2.50467 10.9367 2.50867 10.906 2.51067C10.896 2.51133 10.884 2.512 10.872 2.512C10.7087 2.512 10.5553 2.43067 10.462 2.29533C10.0093 1.63733 9.32734 1.19467 8.54134 1.04867C8.35934 1.01467 8.17334 0.998 7.99001 0.998C7.38734 0.998 6.80334 1.18067 6.30201 1.52533C6.00067 1.73333 5.74134 1.992 5.53334 2.29467C5.44001 2.43067 5.28534 2.51133 5.12001 2.51133C5.11534 2.51133 5.09601 2.51067 5.09134 2.51067C5.05934 2.50867 5.02867 2.50467 4.99934 2.50067C4.98934 2.49933 4.97934 2.49867 4.96934 2.49867Z" />
  </svg>
);

export default function AirQuality({ airnowData }: { airnowData?: AirNowObservations }) {
  const observation = airnowData?.observations?.length ? airnowData.observations[0] : undefined;

  return (
    <Measurement
      value={observation?.aqi ?? '–'}
      secondaryValue={observation?.aqiLevelName ?? '–'}
      label={`Air Quality${observation?.pollutant ? ` (${observation.pollutant})` : ''}`}
      icon={AirQualityIcon()}
    />
  );
}
