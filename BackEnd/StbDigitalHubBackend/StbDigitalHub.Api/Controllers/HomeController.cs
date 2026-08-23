using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using StbDigitalHub.Api.Services;

namespace StbDigitalHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/home")]
public class HomeController(HomeService homeService) : ControllerBase
{
    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
    {
        if (!TryGetClientId(out var clientId))
        {
            return Unauthorized(new { message = "Jeton invalide." });
        }

        try
        {
            return Ok(await homeService.GetDashboardAsync(clientId, cancellationToken));
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    private bool TryGetClientId(out long clientId)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? User.FindFirstValue("sub");
        return long.TryParse(claim, out clientId);
    }
}
