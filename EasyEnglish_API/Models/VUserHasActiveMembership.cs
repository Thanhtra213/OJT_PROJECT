using System;
using System.Collections.Generic;

namespace EasyEnglish_API.Models;

public partial class VUserHasActiveMembership
{
    public int UserId { get; set; }

    public int HasActiveMembership { get; set; }
}
