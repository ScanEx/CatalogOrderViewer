using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Server.Models
{
    [Table("order_state", Schema="catalog")]
    public class OrderState
    {
        public OrderState () {}
        [Key, Column("order_state_id")]
        public int Id { get; set; }
        [Column("order_state_code")]
        public string Code { get; set; }
        [Column("order_state_name")]
        public string Name { get; set; }
    }
}