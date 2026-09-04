#!/bin/bash

source .env

docker build \
--build-arg AUTH_API_URL=$AUTH_API_URL \
--build-arg VITE_AUTH_API_URL=$VITE_AUTH_API_URL \
--build-arg TBA3_DATA_API_URL=$TBA3_DATA_API_URL \
--build-arg VITE_TBA3_DATA_API_URL=$VITE_TBA3_DATA_API_URL \
--build-arg VITE_TEST_GROUP=$VITE_TEST_GROUP \
--build-arg VITE_TEST_ID=$VITE_TEST_ID \
--build-arg VITE_SURVEY_ID=$VITE_SURVEY_ID \
--build-arg VITE_MATH_TEST_ID_A=$VITE_MATH_TEST_ID_A \
--build-arg VITE_MATH_TEST_ID_B=$VITE_MATH_TEST_ID_B \
--build-arg VITE_PDF_ENABLED=$VITE_PDF_ENABLED \
--build-arg FRONTEND_URL=$FRONTEND_URL \
-t tba3-dk8 \
.
