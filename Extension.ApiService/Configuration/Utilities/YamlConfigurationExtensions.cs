using Microsoft.Extensions.Configuration;

namespace Extension.ApiService.Configuration;

public static class YamlConfigurationExtensions
{
    public static IConfigurationBuilder AddYamlFileIfExists(this IConfigurationBuilder builder, string path)
    {
        if (!File.Exists(path))
        {
            return builder;
        }

        using var stream = File.OpenRead(path);
        var data = SimpleYamlParser.Parse(stream);
        builder.AddInMemoryCollection(data);
        return builder;
    }
}
