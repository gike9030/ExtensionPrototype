var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.Extension_ApiService>("apiservice");

builder.AddNpmApp("frontend", "../frontend", "dev")
    .WithReference(apiService)
    .WaitFor(apiService)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints();

builder.Build().Run();
