using System.Text;

namespace Extension.ApiService.Configuration;

internal static class SimpleYamlParser
{
    public static IDictionary<string, string?> Parse(Stream stream)
    {
        using var reader = new StreamReader(stream, Encoding.UTF8, true, leaveOpen: true);
        return Parse(reader.ReadToEnd());
    }

    private static IDictionary<string, string?> Parse(string yaml)
    {
        var data = new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase);
        var sections = new Stack<(int Indent, string Path)>();

        foreach (var rawLine in yaml.Split(new[] { "\r\n", "\n" }, StringSplitOptions.None))
        {
            if (string.IsNullOrWhiteSpace(rawLine))
            {
                continue;
            }

            var line = rawLine.TrimEnd();
            var trimmed = line.TrimStart();
            if (trimmed.StartsWith('#'))
            {
                continue;
            }

            var indent = line.Length - trimmed.Length;

            while (sections.Count > 0 && indent <= sections.Peek().Indent)
            {
                sections.Pop();
            }

            var separatorIndex = trimmed.IndexOf(':');
            if (separatorIndex <= 0)
            {
                continue;
            }

            var key = trimmed[..separatorIndex].Trim();
            var value = trimmed[(separatorIndex + 1)..].Trim();
            var path = sections.Count > 0 ? $"{sections.Peek().Path}:{key}" : key;

            if (string.IsNullOrEmpty(value))
            {
                sections.Push((indent, path));
                continue;
            }

            data[path] = Unquote(value);
        }

        return data;
    }

    private static string Unquote(string value)
    {
        if (value.Length >= 2)
        {
            if ((value[0] == '"' && value[^1] == '"') || (value[0] == '\'' && value[^1] == '\''))
            {
                return value[1..^1];
            }
        }

        return value;
    }
}
