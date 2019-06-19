using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Server;
using Server.Models;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class RegionsController : ControllerBase
    {
        private readonly CatalogContext _context;

        public RegionsController(CatalogContext context)
        {
            _context = context;
        }

        // GET: api/Regions
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Region>>> GetRegions()
        {
            return await _context.Regions.ToListAsync();
        }

        // GET: api/Regions/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Region>> GetRegion(int id)
        {
            var Region = await _context.Regions.FindAsync(id);

            if (Region == null)
            {
                return NotFound();
            }

            return Region;
        }
        // GET: api/Regions/ByOrder/5
        [HttpGet("ByOrder/{id}")]
        public async Task<ActionResult<IEnumerable<Region>>> GetRegionsByOrder(int id)
        {
            return await Task.Run(() => _context.Regions.Where(e => e.OrderId == id).ToListAsync());
        }

        // PUT: api/Regions/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutRegion(int id, Region Region)
        {
            if (id != Region.Id)
            {
                return BadRequest();
            }

            _context.Entry(Region).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!RegionExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // POST: api/Regions
        [HttpPost]
        public async Task<ActionResult<Region>> PostRegion(Region Region)
        {
            _context.Regions.Add(Region);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetRegion", new { id = Region.Id }, Region);
        }

        // DELETE: api/Regions/5
        [HttpDelete("{id}")]
        public async Task<ActionResult<Region>> DeleteRegion(int id)
        {
            var Region = await _context.Regions.FindAsync(id);
            if (Region == null)
            {
                return NotFound();
            }

            _context.Regions.Remove(Region);
            await _context.SaveChangesAsync();

            return Region;
        }

        private bool RegionExists(int id)
        {
            return _context.Regions.Any(e => e.Id == id);
        }
    }
}
