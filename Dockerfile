FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app
COPY ./src .
RUN dotnet restore
RUN dotnet publish -o out

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .
ENTRYPOINT ["dotnet", "webapi.dll"]

EXPOSE 8080