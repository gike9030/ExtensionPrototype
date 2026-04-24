namespace Extension.ApiService.Exceptions;

internal sealed class QuotaExceededException(string message) : Exception(message)
{
}

internal sealed class ServiceUnavailableException(string message) : Exception(message)
{
}
