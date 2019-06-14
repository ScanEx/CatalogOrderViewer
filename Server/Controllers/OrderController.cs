using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Server.Models;
using Server.Repositories;

namespace Server.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase  
    {
        private readonly IOrderRepository repo;
        public OrderController (IOrderRepository repo) : base() {
            this.repo = repo;
        }
        // GET: api/Order
        [HttpGet]
        public async Task<IEnumerable<Order>> Get()
        {
            return await this.repo.RetrieveAllAsync();
        }

        [HttpGet("Client/{id}")]
        public async Task<IEnumerable<Order>> GetForClient(int id)
        {
            return await this.repo.RetrieveForClientAsync(id);
        }

        // GET: api/Order/5
        [HttpGet("{id}", Name = "Get")]
        public async Task<Order> Get(int id)
        {
            return await this.repo.RetrieveAsync(id);
        }

        // POST: api/Order
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Order e)
        {
            if (e == null) {
                return BadRequest();
            }
            else {
                var added = await this.repo.CreateAsync(e);
                return new ObjectResult(added);
            }
        }

        // PUT: api/Order/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Order e)
        {
            if (e == null) {
                return BadRequest();
            }
            else {
                var existing = await this.repo.RetrieveAsync(id);
                if (existing == null) {
                    return NotFound();
                }
                else {
                    var updated = await this.repo.UpdateAsync(id, e);
                    return NoContent();
                }
            }
        }

        // DELETE: api/ApiWithActions/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await this.repo.RetrieveAsync(id);
            if (existing == null) {
                return NotFound();
            }
            else {
                bool deleted = await this.repo.DeleteAsync(id);
                if (deleted) {
                    return NoContent();
                }
                else {
                    return BadRequest();
                }                
            }
        }
    }
}
